export interface UploadIntent {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  folder?: string;
}

export interface UploadSession {
  assetId: string;
  storageKey: string;
  uploadUrl: string;
  headers?: Record<string, string>;
}

export interface MediaStorage {
  createUpload(intent: UploadIntent): Promise<UploadSession>;
  confirmUpload(assetId: string, storageKey: string): Promise<{ publicUrl: string }>;
  getPublicUrl(storageKey: string, variant?: string): string;
  deleteObject(storageKey: string): Promise<void>;
}
