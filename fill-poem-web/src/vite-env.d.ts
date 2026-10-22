/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOADING_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
