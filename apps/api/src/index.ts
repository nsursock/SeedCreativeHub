import { createReadStream, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { graphql, parse, validate } from "graphql";
import { createCache, createMailer, createMediaStorage, createRedis } from "./adapters/index.js";
import { getSession, timingSafeEqualString } from "./auth/session.js";
import { prisma } from "./db.js";
import { env } from "./env.js";
import { resolvers, type Ctx } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { initObservability } from "./observability.js";

const seedCacheDir = join(dirname(fileURLToPath(import.meta.url)), "../data/seed-cache");

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function main() {
  initObservability();
  const redis = createRedis();
  try {
    await redis.connect();
  } catch (err) {
    console.warn("[redis] connect deferred:", (err as Error).message);
  }
  const cache = createCache(redis);
  const mailer = createMailer();
  const media = createMediaStorage();

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
  });
  await app.register(cookie, { secret: env.sessionSecret });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
    redis,
    nameSpace: "rl:",
  });

  app.get("/health", async () => ({ ok: true, service: "creative-hub-api" }));

  /** Local seed outputs (ElevenLabs / HF / cached AI media) for smoke tests. */
  app.get<{ Params: { file: string } }>("/seed-media/:file", async (req, reply) => {
    const file = basename(req.params.file);
    if (!file || file.includes("..")) return reply.code(400).send({ error: "bad file" });
    const path = join(seedCacheDir, file);
    if (!existsSync(path)) return reply.code(404).send({ error: "not found" });
    const { size } = await import("node:fs/promises").then((fs) => fs.stat(path));
    const mime = file.endsWith(".mp3")
      ? "audio/mpeg"
      : file.endsWith(".wav")
        ? "audio/wav"
        : file.endsWith(".mp4")
          ? "video/mp4"
          : file.endsWith(".jpg") || file.endsWith(".jpeg")
            ? "image/jpeg"
            : file.endsWith(".png")
              ? "image/png"
              : file.endsWith(".webp")
                ? "image/webp"
                : file.endsWith(".gif")
                  ? "image/gif"
                  : "application/octet-stream";
    reply.header("Content-Type", mime);
    reply.header("Content-Length", String(size));
    reply.header("Accept-Ranges", "bytes");
    reply.header("Cache-Control", "public, max-age=3600");
    return reply.send(createReadStream(path));
  });

  app.post("/uploads/signed", async (req, reply) => {
    // Dev fallback when Supabase credentials are absent.
    reply.code(501).send({
      error: "Configure SUPABASE_* for real uploads, or attach files via external URL/embed.",
    });
  });

  app.post<{
    Body: { query: string; variables?: Record<string, unknown>; operationName?: string };
  }>("/graphql", async (req, reply) => {
    const sessionId = req.cookies.sid;
    const session = await getSession(cache, sessionId);
    let pendingCookies: { sid?: string; clear?: boolean; csrf?: string } = {};

    const ctx: Ctx = {
      prisma,
      cache,
      mailer,
      media,
      user: session?.user ?? null,
      csrfToken: session?.csrfToken ?? null,
      sessionId: sessionId ?? null,
      locale: (req.headers["accept-language"] ?? "en").toString().slice(0, 2),
      setSession: (sid, csrf) => {
        pendingCookies = { sid, csrf };
      },
      clearSession: () => {
        pendingCookies = { clear: true };
      },
    };

    const source = req.body?.query ?? "";
    const document = parse(source);
    const errors = validate(schema, document);
    if (errors.length) {
      return reply.code(400).send({ errors });
    }

    const isMutation = document.definitions.some(
      (d) => d.kind === "OperationDefinition" && d.operation === "mutation",
    );
    if (isMutation && session) {
      const headerCsrf = (req.headers["x-csrf-token"] as string | undefined) ?? "";
      if (!headerCsrf || !timingSafeEqualString(headerCsrf, session.csrfToken)) {
        // Allow auth bootstrap mutations without prior session CSRF
        const opName = req.body?.operationName ?? "";
        const bootstrap = ["signIn", "signUp", "joinWaitlist", "requestMagicLink", "consumeMagicLink", "claimProfile"].some(
          (n) => source.includes(n) || opName === n,
        );
        if (!bootstrap) {
          return reply.code(403).send({
            errors: [{ message: "CSRF validation failed", extensions: { code: "CSRF" } }],
          });
        }
      }
    }

    const result = await graphql({
      schema,
      source,
      variableValues: req.body?.variables,
      operationName: req.body?.operationName,
      contextValue: ctx,
    });

    if (pendingCookies.clear) {
      reply.clearCookie("sid", { path: "/" });
    } else if (pendingCookies.sid) {
      reply.setCookie("sid", pendingCookies.sid, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: env.nodeEnv === "production",
        maxAge: env.sessionTtlSeconds,
      });
    }

    return reply.send(result);
  });

  await app.listen({ host: env.host, port: env.port });
  console.log(`API listening on http://${env.host}:${env.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
