export class SeedAiError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.name = "SeedAiError";
    this.code = opts?.code ?? "ai";
    this.status = opts?.status;
  }
}
