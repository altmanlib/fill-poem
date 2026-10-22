import { fadeInUp } from '../anim/motion.ts';
import { LOTTERY_CHANCES_ON_CLEAR } from '../game/lottery.ts';
import { createStageSession, type StageSession } from '../game/stage-session.ts';
import { parseLine, STAGES } from '../game/stages.ts';
import { h } from '../lib/dom.ts';
import { attachDrag } from '../lib/drag.ts';
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
      const segments = parseLine(line.text, blankStart);
      const row = h(
        'p',
        { class: 'stage__line' },
        segments.map((seg) => {
          if (seg.kind === 'text') return seg.text;
          const slot = h('button', { class: 'stage__blank', type: 'button', dataset: { slot: String(seg.index) }, onclick: () => onRemove(seg.index) });
          blankEls[seg.index] = slot;
          blankStart += 1;
          return slot;
        })
      );
      return row;
    });
    const board = h('div', { class: 'stage__board' }, lines);
    const sources = h('p', { class: 'stage__sources' }, def.lines.map((l) => l.source).join(' · '));

    const pool = h('div', { class: 'stage__pool' });
    const submit = h('button', { class: 'btn btn--primary', type: 'button', onclick: () => void onSubmit() }, '提交');
    const wrap = h('div', { class: 'stage__body' }, [
      tag,
      title,
      board,
      sources,
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
        const btn = h('button', { class: 'stage__char', type: 'button' }, c);
        attachDrag(btn, { onTap: () => onPlace(c), onDrop: (x, y) => onDropChar(c, x, y) });
        btn.classList.toggle('is-used', slots.includes(c));
        pool.append(btn);
      }
      submit.toggleAttribute('disabled', !session.isFull());
    }

    function onPlace(char: string, slot?: number): void {
      if (locked || !session.place(char, slot)) return;
      sfx.tick();
      refresh();
    }

    // Dropping on a blank fills that blank; dropping elsewhere on the board fills the first empty one.
    function onDropChar(char: string, x: number, y: number): void {
      const hit = document.elementFromPoint(x, y);
      const blank = hit?.closest<HTMLElement>('.stage__blank');
      if (blank?.dataset.slot !== undefined) onPlace(char, Number(blank.dataset.slot));
      else if (hit && board.contains(hit)) onPlace(char);
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
        const prev = store.get();
        const badges = Math.max(prev.badges, stage + 1);
        // First full clear grants 3 lottery chances.
        const granted = prev.badges < STAGES.length && badges >= STAGES.length ? LOTTERY_CHANCES_ON_CLEAR : 0;
        store.set({ badges, chances: prev.chances + granted });
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
    fadeInUp([tag, title, board, sources, wrap.querySelector('.stage__candidates') as HTMLElement, submit], { distance: 14 });
  }

  render();

  return {
    el,
    // Progress lives in the store; swallowing back keeps the player on the current stage.
    back() {}
  };
}
