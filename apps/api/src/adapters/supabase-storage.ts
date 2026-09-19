import { randomUUID } from "node:crypto";
import { env } from "../env.js";
import type { MediaStorage, UploadIntent, UploadSession } from "./media-storage.js";

/** Thin Supabase Storage adapter — product code never imports Supabase SDK directly. */
export class SupabaseStorageAdapter implements MediaStorage {
  constructor(
    private readonly baseUrl = env.supabaseUrl,
    private readonly secretKey = env.supabaseSecretKey,
    private readonly bucket = env.supabaseStorageBucket,
  ) {}

  async createUpload(intent: UploadIntent): Promise<UploadSession> {
    const assetId = randomUUID();
    const safeName = intent.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${intent.folder ?? "uploads"}/${assetId}-${safeName}`;

    if (!this.baseUrl || !this.secretKey) {
      // Local/dev fallback: client POSTs to our thin REST upload endpoint instead.
      return {
        assetId,
        storageKey,
        uploadUrl: `${env.publicApiUrl}/uploads/signed`,
        headers: { "x-storage-key": storageKey, "x-asset-id": assetId },
      };
    }

    const uploadUrl = `${this.baseUrl}/storage/v1/object/${this.bucket}/${storageKey}`;
    return {
      assetId,
      storageKey,
      uploadUrl,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": intent.mimeType,
        "x-upsert": "true",
      },
    };
  }

  async confirmUpload(_assetId: string, storageKey: string) {
    return { publicUrl: this.getPublicUrl(storageKey) };
  }

  getPublicUrl(storageKey: string, _variant?: string): string {
    if (!this.baseUrl) {
      return `${env.publicApiUrl}/media/${encodeURIComponent(storageKey)}`;
    }
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${storageKey}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (!this.baseUrl || !this.secretKey) return;
    await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${storageKey}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
  }
}

export function createMediaStorage(): MediaStorage {
  return new SupabaseStorageAdapter();
}
