import { expect, test } from 'vitest';
import { createStageSession } from '../src/game/stage-session.ts';
import { answersOf, parseLine, STAGES } from '../src/game/stages.ts';

test('stage configs: blank counts are 1/2/3/4 and answers are candidates', () => {
  expect(STAGES.map((s) => answersOf(s).length)).toEqual([1, 2, 3, 4]);
  for (const s of STAGES) for (const a of answersOf(s)) expect(s.candidates).toContain(a);
});

test('parseLine numbers blanks from the given start', () => {
  expect(parseLine('甲【光】乙【金】', 2)).toEqual([
    { kind: 'text', text: '甲' },
    { kind: 'blank', index: 2 },
    { kind: 'text', text: '乙' },
    { kind: 'blank', index: 3 }
  ]);
});

const stage2 = STAGES[1]!;

test('place fills in order, rejects used chars, remove frees the slot', () => {
  const s = createStageSession(stage2);
  expect(s.place('散')).toBe(true);
  expect(s.place('散')).toBe(false);
  expect(s.place('里')).toBe(true);
  expect(s.place('中')).toBe(false);
  expect(s.isFull()).toBe(true);
  s.remove(0);
  expect(s.slots()).toEqual([null, '里']);
});

test('wrong twice removes distractors; correct submit passes', () => {
  const s = createStageSession(stage2);
  s.place('散');
  s.place('里');
  expect(s.submit()).toEqual({ ok: false, level: 1 });
  expect(s.slots()).toEqual([null, null]);
  expect(s.candidates()).toHaveLength(4);
  s.place('中');
  s.place('章');
  expect(s.submit()).toEqual({ ok: false, level: 2 });
  expect(s.candidates()).toEqual(['章', '中']);
  s.place('章');
  s.place('中');
  expect(s.submit()).toEqual({ ok: true });
});
