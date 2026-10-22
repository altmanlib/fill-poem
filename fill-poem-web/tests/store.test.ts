import { expect, test, vi } from 'vitest';
import { createStore } from '#/lib/store.ts';

test('set merges the patch, freezes state and notifies subscribers', () => {
  const store = createStore({ stage: 0, badges: 0 });
  const fn = vi.fn();
  const off = store.subscribe(fn);

  store.set({ badges: 1 });
  expect(store.get()).toEqual({ stage: 0, badges: 1 });
  expect(Object.isFrozen(store.get())).toBe(true);
  expect(fn).toHaveBeenCalledTimes(1);

  off();
  store.set({ stage: 1 });
  expect(fn).toHaveBeenCalledTimes(1);
});
