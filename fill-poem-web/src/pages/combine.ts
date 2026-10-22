import { armEnter, fadeInUp } from '../anim/motion.ts';
import { h } from '../lib/dom.ts';
import { ph } from '../lib/ph.ts';
import { sfx } from '../lib/sfx.ts';
import type { PageContext, PageInstance } from '../types.ts';

export function createCombinePage({ go }: PageContext): PageInstance {
  const art = ph({ asset: 'combine/coin', className: 'combine__art', ratio: '750 / 800' });
  const text = h('p', { class: 'combine__text' }, ['四枚金章已齐，国宝寻金成功！', h('br'), '2027熊猫金币现已正式发行，邀您共赏国宝新章！']);
  const next = h(
    'button',
    {
      class: 'btn btn--primary',
      type: 'button',
      onclick: () => {
        sfx.tick();
        void go('intro');
      }
    },
    '前往品鉴'
  );
  const el = h('div', { class: 'page page--combine' }, [art, text, next]);
  const targets = [art, text, next];
  armEnter(targets);
  return {
    el,
    enter() {
      fadeInUp(targets, { distance: 18 });
    }
  };
}
