import { armEnter, fadeInUp } from '../anim/motion.ts';
import { draw } from '../game/lottery.ts';
import { h } from '../lib/dom.ts';
import { openModal } from '../lib/modal.ts';
import { ph } from '../lib/ph.ts';
import { sfx } from '../lib/sfx.ts';
import type { PageContext, PageInstance } from '../types.ts';

export function createLotteryPage({ store, go }: PageContext): PageInstance {
  const title = h('h1', { class: 'lottery__title' }, '助力国宝寻金赢首发好礼！');
  const hint = h('p', { class: 'lottery__hint' }, '点击右上方，首次分享可获1次抽奖机会');
  const art = ph({ asset: 'lottery/stage', className: 'lottery__art', ratio: '750 / 700' });
  const remain = h('p', { class: 'lottery__remain' });
  const btn = h('button', { class: 'btn btn--primary', type: 'button', onclick: () => void onDraw() }, '抽奖1次');
  const home = h('button', { class: 'lottery__home', type: 'button', onclick: () => void go('home') }, '返回主页');
  const el = h('div', { class: 'page page--lottery' }, [title, hint, art, remain, btn, home]);
  const targets = [title, hint, art, remain, btn, home];
  armEnter(targets);

  function refresh(): void {
    const { chances } = store.get();
    remain.textContent = `剩余抽奖次数：${chances}`;
    btn.toggleAttribute('disabled', chances <= 0);
  }

  let drawing = false;
  async function onDraw(): Promise<void> {
    if (drawing || store.get().chances <= 0) return;
    drawing = true;
    sfx.tick();
    store.set({ chances: store.get().chances - 1 });
    refresh();
    const result = draw();
    if (result.won) {
      await openModal(el, {
        title: '恭喜你',
        text: `成功抽中【${result.prize}】`,
        button: '填写获奖信息',
        tone: 'win',
        art: ph({ asset: 'lottery/win', className: 'modal__art', ratio: '4 / 3' })
      });
      drawing = false;
      void go('lead');
      return;
    }
    await openModal(el, {
      title: '很遗憾，与好礼擦肩而过',
      button: '好的',
      tone: 'hint',
      art: ph({ asset: 'lottery/miss', className: 'modal__art', ratio: '4 / 3' })
    });
    drawing = false;
  }

  refresh();
  return {
    el,
    enter() {
      fadeInUp(targets, { distance: 18 });
    },
    back() {
      void go('home');
    }
  };
}
