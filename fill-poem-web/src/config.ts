// Central app configuration. All VITE_* env reads and their defaults live here;
// feature modules import `config` instead of touching import.meta.env directly.

const DEFAULT_LOADING_MS = 1800;
const DEFAULT_BGM_TRACK = 'music/03-loop-A-51s-128k.mp3';
const DEFAULT_BGM_VOLUME = 0.18;

function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/** Resolve a path under public/ against Vite BASE_URL (supports relative base './'). */
function publicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\/+/, '')}`;
}

function readMs(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  /** Splash / loading page minimum duration in milliseconds. */
  loadingMs: readMs(import.meta.env.VITE_LOADING_MS, DEFAULT_LOADING_MS),

  bgm: {
    /** Resolved URL for HTMLAudioElement.src; path under public/, overridable via VITE_BGM_TRACK. */
    trackUrl: publicAssetUrl(readString(import.meta.env.VITE_BGM_TRACK, DEFAULT_BGM_TRACK)),
    volume: DEFAULT_BGM_VOLUME
  }
} as const;
