import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { waitUntilReady } from '#/lib/readiness.ts';

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(value: string) {
    if (value.includes('hang')) return;
    queueMicrotask(() => (value.includes('broken') ? this.onerror?.() : this.onload?.()));
  }
}

const font = { family: 'X', sampleText: 'a' };

beforeEach(() => {
  vi.stubGlobal('Image', FakeImage);
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load: () => Promise.resolve([{}]) } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'fonts');
});

describe('waitUntilReady', () => {
  test('ok when all images load; progress reaches 1', async () => {
    const ratios: number[] = [];
    const r = await waitUntilReady({ images: ['a.png', 'b.png'], font }, { timeoutMs: 1000, onProgress: (x) => ratios.push(x) });
    expect(r).toMatchObject({ ok: true, timedOut: false, imagesFailed: 0, fontReady: true });
    expect(ratios[ratios.length - 1]).toBe(1);
  });

  test('a failed image makes the result not ok', async () => {
    const r = await waitUntilReady({ images: ['a.png', 'broken.png'], font }, { timeoutMs: 1000 });
    expect(r).toMatchObject({ ok: false, timedOut: false, imagesFailed: 1 });
  });

  test('a missing font does not block readiness', async () => {
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load: () => Promise.reject(new Error('nope')) } });
    const r = await waitUntilReady({ images: ['a.png'], font }, { timeoutMs: 1000 });
    expect(r).toMatchObject({ ok: true, fontReady: false });
  });

  test('times out when an image never settles', async () => {
    const r = await waitUntilReady({ images: ['hang.png'], font }, { timeoutMs: 20 });
    expect(r).toMatchObject({ ok: false, timedOut: true });
  });
});
