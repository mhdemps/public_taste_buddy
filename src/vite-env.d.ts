/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Intentionally empty — add `VITE_*` keys here if you introduce client env vars.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
