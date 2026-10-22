import { armEnter, fadeInUp } from '../anim/motion.ts';
import { STAGES } from '../game/stages.ts';
import { h } from '../lib/dom.ts';
import { ph } from '../lib/ph.ts';
import { FLAG_RULES_SEEN, hasFlag } from '../lib/session-flag.ts';
import { sfx } from '../lib/sfx.ts';
import type { PageContext, PageInstance } from '../types.ts';

export function createHomePage({ go, store }: PageContext): PageInstance {
  const prize = h(
    'button',
    {
      class: 'home__prize',
      type: 'button',
      onclick: () => {
        sfx.tick();
        void go('lead');
      }
    },
    '获奖信息'
  );
  const title = h('h1', { class: 'home__title' }, [h('span', {}, '竹林雅集'), h('span', { class: 'home__title-accent' }, '国宝寻金')]);
  const sub = h('p', { class: 'home__sub' }, ['通关诗词谜题', h('br'), '助力国宝寻金，赢金币上新好礼！']);
  const art = ph({ asset: 'home/kv', className: 'home__art', ratio: '750 / 700' });
  const start = h(
    'button',
    {
      class: 'btn btn--primary',
      type: 'button',
      onclick: () => {
        sfx.tick();
        // Players who already collected all badges go straight to the lottery; the rules page is shown at least once per session.
        if (store.get().badges >= STAGES.length) void go('lottery');
        else void go(hasFlag(FLAG_RULES_SEEN) ? 'stage' : 'rules');
      }
    },
    '即刻出发'
  );

  const el = h('div', { class: 'page page--home' }, [prize, title, sub, art, start]);
  const targets = [title, sub, art, start];
  armEnter(targets);

  return {
    el,
    enter() {
      fadeInUp(targets, { distance: 18 });
    }
  };
}
