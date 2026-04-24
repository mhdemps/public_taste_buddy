/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public URL of the JSON API host (no `/api` suffix). Used when the UI is on Vercel etc. */
  readonly VITE_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
