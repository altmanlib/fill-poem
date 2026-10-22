import { answersOf, type StageDef } from './stages.ts';

export type SubmitResult = { ok: true } | { ok: false; level: 1 | 2 };

export interface StageSession {
  readonly answers: readonly string[];
  /** Characters currently offered; shrinks to the answers after the second wrong submit. */
  readonly candidates: () => readonly string[];
  /** Filled characters per blank (null = empty). */
  readonly slots: () => ReadonlyArray<string | null>;
  /** Fill the first empty blank with a candidate; false if it is used up or no blank is free. */
  place: (char: string) => boolean;
  /** Return the character in a blank to the candidate pool. */
  remove: (slot: number) => void;
  isFull: () => boolean;
  /** Check the answer. First wrong → level 1 (retry); second and later → level 2 (distractors removed). Wrong submits clear the blanks. */
  submit: () => SubmitResult;
}

export function createStageSession(def: StageDef): StageSession {
  const answers = answersOf(def);
  let candidates: readonly string[] = def.candidates;
  const slots: Array<string | null> = answers.map(() => null);
  let wrong = 0;

  return {
    answers,
    candidates: () => candidates,
    slots: () => slots,
    place(char) {
      if (!candidates.includes(char) || slots.includes(char)) return false;
      const free = slots.indexOf(null);
      if (free < 0) return false;
      slots[free] = char;
      return true;
    },
    remove(slot) {
      if (slot >= 0 && slot < slots.length) slots[slot] = null;
    },
    isFull: () => !slots.includes(null),
    submit() {
      if (slots.every((c, i) => c === answers[i])) return { ok: true };
      wrong += 1;
      slots.fill(null);
      if (wrong >= 2) candidates = def.candidates.filter((c) => answers.includes(c));
      return { ok: false, level: wrong >= 2 ? 2 : 1 };
    }
  };
}
