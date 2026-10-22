// Client-side lottery stand-in. Outcome, stock and chance ledger move to the server in R016 / R017;
// keep callers behind `draw()` so only this module changes.

export const LOTTERY_CHANCES_ON_CLEAR = 3;

export interface DrawResult {
  won: boolean;
  /** Prize label shown in the win dialog. */
  prize: string;
}

const WIN_RATE = 0.3;
const PRIZE = '徽章一份';

export function draw(random: () => number = Math.random): DrawResult {
  return { won: random() < WIN_RATE, prize: PRIZE };
}
