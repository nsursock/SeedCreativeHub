#!/usr/bin/env node
/**
 * Inspect staging DB via Prisma (no secret printing).
 * Usage: node scripts/with-env.mjs .env.staging -- npx tsx scripts/staging-db-inspect.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const schemas = await prisma.$queryRaw<Array<{ nspname: string }>>`
  SELECT nspname FROM pg_namespace
  WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema'
  ORDER BY 1
`;
console.log("schemas:", schemas.map((r) => r.nspname).join(", "));

const hub = await prisma.$queryRaw<Array<{ ok: boolean }>>`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'creative_hub'
  ) AS ok
`;
console.log("creative_hub exists:", hub[0]?.ok);

const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'creative_hub'
  ORDER BY 1
`;
console.log("creative_hub tables:", tables.length);
if (tables.length) console.log("  ", tables.map((r) => r.table_name).join(", "));

const migPublic = await prisma.$queryRaw<Array<{ ok: boolean }>>`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
  ) AS ok
`;
console.log("_prisma_migrations in public:", migPublic[0]?.ok);

if (migPublic[0]?.ok) {
  const rows = await prisma.$queryRaw<Array<{ migration_name: string }>>`
    SELECT migration_name FROM public._prisma_migrations ORDER BY started_at
  `;
  console.log("public migrations:", rows.map((r) => r.migration_name).join(", ") || "(none)");
}

const migHub = await prisma.$queryRaw<Array<{ ok: boolean }>>`
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'creative_hub' AND table_name = '_prisma_migrations'
  ) AS ok
`;
console.log("_prisma_migrations in creative_hub:", migHub[0]?.ok);

await prisma.$disconnect();
