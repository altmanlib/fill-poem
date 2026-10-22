import { armEnter, fadeInUp } from '../anim/motion.ts';
import { h } from '../lib/dom.ts';
import { ph } from '../lib/ph.ts';
import { sfx } from '../lib/sfx.ts';
import type { PageFactory, RouteName, TransitionName } from '../types.ts';

interface StubOpts {
  route: RouteName;
  title: string;
  next: RouteName;
  transition?: TransitionName;
}

/** Placeholder page: asset slot + a button to the next route. Replaced by the real page per task. */
export function createStubPage({ route, title, next, transition = 'fade' }: StubOpts): PageFactory {
  return ({ go }) => {
    const art = ph({ asset: `${route}/page`, className: 'stub__art', ratio: '750 / 1100' });
    const heading = h('h1', { class: 'stub__title' }, title);
    const btn = h(
      'button',
      {
        class: 'btn',
        type: 'button',
        onclick: () => {
          sfx.tick();
          void go(next, { transition });
        }
      },
      '下一步'
    );
    const el = h('div', { class: `page page--${route}` }, [heading, art, btn]);
    armEnter([heading, art, btn]);
    return {
      el,
      enter() {
        fadeInUp([heading, art, btn], { distance: 14 });
      }
    };
  };
}
