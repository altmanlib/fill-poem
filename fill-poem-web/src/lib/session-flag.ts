// Boolean flags scoped to the browser tab session (sessionStorage).
// Storage can throw (privacy mode) or be absent; fall back to an in-memory set so the flow still works.

const memory = new Set<string>();

const PREFIX = 'fill-poem:';

export function hasFlag(name: string): boolean {
  if (memory.has(name)) return true;
  try {
    return window.sessionStorage.getItem(PREFIX + name) === '1';
  } catch {
    return false;
  }
}

export function setFlag(name: string): void {
  memory.add(name);
  try {
    window.sessionStorage.setItem(PREFIX + name, '1');
  } catch {
    // In-memory fallback already recorded the flag.
  }
}

/** Test helper: forget every flag. */
export function resetFlags(): void {
  memory.clear();
  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith(PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch {
    // Nothing to clear.
  }
}

export const FLAG_RULES_SEEN = 'rules-seen';
