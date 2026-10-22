/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOADING_MS?: string;
  /** Path under public/ for looped BGM, e.g. music/03-loop-A-51s-128k.mp3 */
  readonly VITE_BGM_TRACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
