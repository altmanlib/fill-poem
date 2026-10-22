import type { Store } from '../types.ts';

export function createStore<T extends object>(initial: T): Store<T> {
  let state: T = Object.freeze({ ...initial });
  const listeners = new Set<(state: T) => void>();

  return {
    get: () => state,
    set(patch) {
      state = Object.freeze({ ...state, ...patch });
      for (const fn of listeners) fn(state);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}
