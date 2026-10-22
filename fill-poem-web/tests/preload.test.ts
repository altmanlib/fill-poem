import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { preloadImages } from '../src/lib/preload.ts';

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  #src = '';

  get src(): string {
    return this.#src;
  }

  set src(value: string) {
    this.#src = value;
    // Simulate an async network response so ordering isn't guaranteed.
    queueMicrotask(() => {
      if (value.includes('broken')) this.onerror?.();
      else this.onload?.();
    });
  }
}

beforeEach(() => {
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('preloadImages', () => {
  test('resolves immediately with ratio 1 for an empty list', async () => {
    const onProgress = vi.fn();
    const summary = await preloadImages([], onProgress);
    expect(summary).toEqual({ total: 0, loaded: 0, failed: 0 });
    expect(onProgress).toHaveBeenCalledWith(1);
  });

  test('loads all urls in parallel and reports a monotonically increasing ratio', async () => {
    const urls = ['a.png', 'b.png', 'c.png'];
    const ratios: number[] = [];
    const summary = await preloadImages(urls, (ratio) => ratios.push(ratio));

    expect(summary).toEqual({ total: 3, loaded: 3, failed: 0 });
    expect(ratios).toEqual([1 / 3, 2 / 3, 1]);
  });

  test('counts failed loads without rejecting the overall promise', async () => {
    const urls = ['ok.png', 'broken.png'];
    const summary = await preloadImages(urls);
    expect(summary).toEqual({ total: 2, loaded: 1, failed: 1 });
  });
});
