// Central app configuration. All VITE_* env reads and their defaults live here;
// feature modules import `config` instead of touching import.meta.env directly.

const DEFAULT_LOADING_MS = 1800;

function readMs(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  /** Splash / loading page minimum duration in milliseconds. */
  loadingMs: readMs(import.meta.env.VITE_LOADING_MS, DEFAULT_LOADING_MS)
} as const;
