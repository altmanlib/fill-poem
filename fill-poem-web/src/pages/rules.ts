import { armEnter, fadeInUp } from '#/anim/motion.ts';
import { h } from '#/lib/dom.ts';
import { FLAG_RULES_SEEN, setFlag } from '#/lib/session-flag.ts';
import { sfx } from '#/lib/sfx.ts';
import type { PageContext, PageInstance } from '#/types.ts';

// Copy follows the 1008 brief ("规则页文案"); keep in sync with docs/briefs.
const RULES: ReadonlyArray<{ text: string; strong: string }> = [
  { text: '拖动正确文字填入诗句缺处即可通关，', strong: '共4关' },
  { text: '每通关1题可获得一枚', strong: '国宝金章' },
  { text: '集齐四枚国宝金章成功帮助国宝寻得金币，', strong: '获得3次抽奖资格' },
  { text: '首次分享活动，可额外获得', strong: '1次抽奖机会' }
];

export function createRulesPage({ go }: PageContext): PageInstance {
  const title = h('h1', { class: 'rules__title' }, '玩法规则');
  const list = h(
    'ol',
    { class: 'rules__list' },
    RULES.map((rule, i) => h('li', { class: 'rules__item' }, [h('span', { class: 'rules__no' }, i + 1), h('p', {}, [rule.text, h('strong', {}, rule.strong)])]))
  );
  const start = h(
    'button',
    {
      class: 'btn btn--primary',
      type: 'button',
      onclick: () => {
        sfx.tick();
        setFlag(FLAG_RULES_SEEN);
        void go('stage');
      }
    },
    '开始游戏'
  );

  const el = h('div', { class: 'page page--rules' }, [title, list, start]);
  const targets = [title, ...Array.from(list.children, (c) => c as HTMLElement), start];
  armEnter(targets);

  return {
    el,
    enter() {
      fadeInUp(targets, { distance: 18 });
    },
    // System back from the rules page returns to the home page.
    back() {
      void go('home');
    }
  };
}
