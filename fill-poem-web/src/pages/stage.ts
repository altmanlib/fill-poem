import { fadeInUp } from '../anim/motion.ts';
import { createStageSession, type StageSession } from '../game/stage-session.ts';
import { parseLine, STAGES } from '../game/stages.ts';
import { h } from '../lib/dom.ts';
import { openModal } from '../lib/modal.ts';
import { ph } from '../lib/ph.ts';
import { sfx } from '../lib/sfx.ts';
import type { PageContext, PageInstance } from '../types.ts';

const NUMERALS = ['一', '二', '三', '四'];

const WRONG_COPY = {
  1: { title: '字词似乎不合雅韵', text: '不妨再斟酌一番' },
  2: { title: '诗意相助，为你扫清迷雾！', text: '快去通关助力国宝寻金吧' }
} as const;

export function createStagePage({ store, go }: PageContext): PageInstance {
  const el = h('div', { class: 'page page--stage' });
  let session: StageSession;
  let locked = false;

  function render(): void {
    const stage = store.get().stage;
    const def = STAGES[stage];
    if (!def) return;
    const { clear } = def;

    const tag = h('div', { class: 'stage__tag' }, `第${NUMERALS[stage]}关`);
    const title = h('h1', { class: 'stage__title' }, def.name);

    // Blank buttons are keyed by their global blank index; refresh() syncs them with the session.
    let blankStart = 0;
    const blankEls: HTMLElement[] = [];
    const lines = def.lines.map((line) => {
      const segments = parseLine(line, blankStart);
      const row = h(
        'p',
        { class: 'stage__line' },
        segments.map((seg) => {
          if (seg.kind === 'text') return seg.text;
          const slot = h('button', { class: 'stage__blank', type: 'button', onclick: () => onRemove(seg.index) });
          blankEls[seg.index] = slot;
          blankStart += 1;
          return slot;
        })
      );
      return row;
    });
    const board = h('div', { class: 'stage__board' }, lines);

    const pool = h('div', { class: 'stage__pool' });
    const submit = h('button', { class: 'btn btn--primary', type: 'button', onclick: () => void onSubmit() }, '提交');
    const wrap = h('div', { class: 'stage__body' }, [
      tag,
      title,
      board,
      h('div', { class: 'stage__candidates' }, [h('span', { class: 'stage__label' }, '候选字'), pool]),
      submit
    ]);

    session = createStageSession(def);

    function refresh(): void {
      const slots = session.slots();
      blankEls.forEach((slot, i) => {
        slot.textContent = slots[i] ?? '';
        slot.classList.toggle('is-filled', slots[i] != null);
      });
      pool.replaceChildren();
      for (const c of session.candidates()) {
        const btn = h('button', { class: 'stage__char', type: 'button', onclick: () => onPlace(c) }, c);
        btn.classList.toggle('is-used', slots.includes(c));
        pool.append(btn);
      }
      submit.toggleAttribute('disabled', !session.isFull());
    }

    function onPlace(char: string): void {
      if (locked || !session.place(char)) return;
      sfx.tick();
      refresh();
    }

    function onRemove(slot: number): void {
      if (locked) return;
      session.remove(slot);
      refresh();
    }

    async function onSubmit(): Promise<void> {
      if (locked || !session.isFull()) return;
      locked = true;
      const result = session.submit();
      if (result.ok) {
        const badges = Math.max(store.get().badges, stage + 1);
        store.set({ badges });
        await openModal(el, {
          title: '恭喜通关',
          text: clear.text,
          button: clear.button,
          tone: 'win',
          art: ph({ asset: `stage/clear-${stage + 1}`, className: 'modal__art', ratio: '4 / 3' })
        });
        if (stage + 1 < STAGES.length) {
          store.set({ stage: stage + 1 });
          el.replaceChildren();
          render();
        } else {
          void go('combine', { transition: 'revealBurst' });
        }
      } else {
        const copy = WRONG_COPY[result.level];
        await openModal(el, { ...copy, button: '我再试试', tone: 'hint', art: ph({ asset: 'stage/wrong', className: 'modal__art', ratio: '4 / 3' }) });
        refresh();
      }
      locked = false;
    }

    el.append(wrap);
    refresh();
    fadeInUp([tag, title, board, wrap.querySelector('.stage__candidates') as HTMLElement, submit], { distance: 14 });
  }

  render();

  return {
    el,
    // Progress lives in the store; swallowing back keeps the player on the current stage.
    back() {}
  };
}
