/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL?: string;
  /** lebanon (local default) · worldwide (prod default) */
  readonly VITE_HUB_MARKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
