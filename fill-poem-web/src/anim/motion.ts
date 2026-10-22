import type { AnimationParams, JSAnimation, TargetsParam } from 'animejs';
import { animate, createTimeline, stagger, utils } from 'animejs';

export { animate, createTimeline, stagger, utils };

export const REDUCED = typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

export const EASE = {
  out: 'out(3)',
  outBack: 'outBack(1.7)',
  inOut: 'inOutQuad',
  spring: 'spring(1, 80, 12, 0)'
} as const;

export function play(targets: TargetsParam, params: AnimationParams): JSAnimation {
  const p: AnimationParams = REDUCED ? { ...params, duration: 1, delay: 0 } : params;
  return animate(targets, p);
}

// 构造阶段同步隐藏将由 enter() 播放入场动画的元素，
// 否则元素会先以最终态绘制一帧，再被动画归零 → 闪现
export function armEnter(targets: HTMLElement | Iterable<HTMLElement>): void {
  const list = targets instanceof HTMLElement ? [targets] : Array.from(targets);
  for (const el of list) el.style.opacity = '0';
}

interface StepOpts {
  delay?: number;
  distance?: number;
  duration?: number;
}

export function fadeInUp(targets: TargetsParam, { delay = 0, distance = 24, duration = 520 }: StepOpts = {}): JSAnimation {
  return play(targets, {
    opacity: [0, 1],
    translateY: [distance, 0],
    duration,
    delay: stagger(80, { start: delay }),
    ease: EASE.out
  });
}

export function pop(targets: TargetsParam, { delay = 0, duration = 460 }: { delay?: number; duration?: number } = {}): JSAnimation {
  return play(targets, {
    opacity: [0, 1],
    scale: [0.6, 1],
    duration,
    delay,
    ease: EASE.outBack
  });
}
