import type { TransitionName } from '#/types.ts';
import { play } from './motion.ts';

// Page transitions: (outgoingEl | null, incomingEl) => Promise.
// incomingEl is already mounted and absolutely positioned above outgoingEl.

type Transition = (outEl: HTMLElement | null, inEl: HTMLElement) => Promise<void>;

const fade: Transition = async (outEl, inEl) => {
  inEl.style.opacity = '0';
  await Promise.all([
    outEl ? play(outEl, { opacity: [1, 0], duration: 260, ease: 'inOutQuad' }) : null,
    play(inEl, { opacity: [0, 1], duration: 360, ease: 'inOutQuad' })
  ]);
};

// Burst from the center, used when the four badges merge into the coin.
const revealBurst: Transition = async (outEl, inEl) => {
  inEl.style.opacity = '0';
  await Promise.all([
    outEl ? play(outEl, { opacity: [1, 0], scale: [1, 0.9], duration: 300, ease: 'inQuad' }) : null,
    play(inEl, { opacity: [0, 1], scale: [1.15, 1], duration: 520, ease: 'outBack(2)' })
  ]);
};

export const transitions: Record<TransitionName, Transition> = { fade, revealBurst };
