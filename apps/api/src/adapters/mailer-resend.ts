import { randomUUID } from "node:crypto";
import { env } from "../env.js";
import type { Mailer, MailMessage } from "./mailer.js";

export class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey = env.resendApiKey,
    private readonly from = env.mailFrom,
  ) {}

  async send(message: MailMessage): Promise<{ id: string }> {
    if (!this.apiKey) {
      console.info("[mailer:dev]", message.to, message.subject);
      return { id: `dev-${randomUUID()}` };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }
}

export function createMailer(): Mailer {
  return new ResendMailer();
}
