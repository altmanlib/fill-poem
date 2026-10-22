import { armEnter, fadeInUp } from '#/anim/motion.ts';
import { h } from '#/lib/dom.ts';
import { ph } from '#/lib/ph.ts';
import { sfx } from '#/lib/sfx.ts';
import type { PageContext, PageInstance } from '#/types.ts';

export function createIntroPage({ go }: PageContext): PageInstance {
  const title = h('h1', { class: 'intro__title' }, ['2027版熊猫贵金属纪念币', h('br'), '现已正式发行']);
  // Product material is pending from the client; the slot holds the coin imagery and copy.
  const art = ph({ asset: 'intro/coin', className: 'intro__art', ratio: '750 / 900' });
  const next = h(
    'button',
    {
      class: 'btn btn--primary',
      type: 'button',
      onclick: () => {
        sfx.tick();
        void go('lottery');
      }
    },
    '抽首发好礼'
  );
  const el = h('div', { class: 'page page--intro' }, [title, art, next]);
  const targets = [title, art, next];
  armEnter(targets);
  return {
    el,
    enter() {
      fadeInUp(targets, { distance: 18 });
    }
  };
}
