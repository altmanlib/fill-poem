import { loadFont } from './fonts.ts';
import { preloadImages } from './preload.ts';

export interface ReadinessPlan {
  images: readonly string[];
  font: { family: string; sampleText: string };
}

export interface ReadinessResult {
  /** True when every image loaded before the deadline. A missing font does not make this false. */
  ok: boolean;
  timedOut: boolean;
  imagesFailed: number;
  fontReady: boolean;
}

interface ReadinessOpts {
  timeoutMs: number;
  /** Combined progress in 0..1; the font counts as one extra unit next to the images. */
  onProgress?: (ratio: number) => void;
}

/** Preload the first-screen assets; resolves with the outcome instead of throwing so the caller can offer a retry. */
export async function waitUntilReady(plan: ReadinessPlan, { timeoutMs, onProgress }: ReadinessOpts): Promise<ReadinessResult> {
  const units = plan.images.length + 1;
  let imageRatio = 0;
  let fontDone = false;
  const report = (): void => onProgress?.((imageRatio * plan.images.length + (fontDone ? 1 : 0)) / units);

  const work = Promise.all([
    preloadImages(plan.images, (r) => {
      imageRatio = r;
      report();
    }),
    loadFont(plan.font.family, plan.font.sampleText, timeoutMs).then((ok) => {
      fontDone = true;
      report();
      return ok;
    })
  ]).then(([images, fontReady]): ReadinessResult => ({ ok: images.failed === 0, timedOut: false, imagesFailed: images.failed, fontReady }));

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<ReadinessResult>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, timedOut: true, imagesFailed: 0, fontReady: fontDone }), timeoutMs);
  });
  try {
    return await Promise.race([work, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
