import { beforeEach, expect, test } from 'vitest';
import { FLAG_RULES_SEEN, hasFlag, resetFlags, setFlag } from '../src/lib/session-flag.ts';

beforeEach(resetFlags);

test('flag is unset until set, then persists in sessionStorage', () => {
  expect(hasFlag(FLAG_RULES_SEEN)).toBe(false);
  setFlag(FLAG_RULES_SEEN);
  expect(hasFlag(FLAG_RULES_SEEN)).toBe(true);
  expect(window.sessionStorage.getItem(`fill-poem:${FLAG_RULES_SEEN}`)).toBe('1');
});
