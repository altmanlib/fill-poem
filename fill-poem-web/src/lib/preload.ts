/** Aggregate outcome of a batch image preload. */
export interface PreloadSummary {
  total: number;
  loaded: number;
  failed: number;
}

/**
 * Load a list of image URLs in parallel and report combined progress as each
 * one settles. A failed load (network error, 404, ...) is counted but never
 * rejects the overall promise, so one missing asset can't block the caller.
 */
export function preloadImages(urls: readonly string[], onProgress?: (ratio: number) => void): Promise<PreloadSummary> {
  const total = urls.length;
  if (total === 0) {
    onProgress?.(1);
    return Promise.resolve({ total: 0, loaded: 0, failed: 0 });
  }

  let settled = 0;
  let failed = 0;

  const loadOne = (url: string): Promise<void> =>
    new Promise((resolve) => {
      const img = new Image();
      const settle = (ok: boolean): void => {
        settled += 1;
        if (!ok) failed += 1;
        onProgress?.(settled / total);
        resolve();
      };
      img.onload = () => settle(true);
      img.onerror = () => settle(false);
      img.src = url;
    });

  return Promise.all(urls.map(loadOne)).then(() => ({ total, loaded: total - failed, failed }));
}
