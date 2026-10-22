import { pop } from '../anim/motion.ts';
import { h } from './dom.ts';
import { sfx } from './sfx.ts';

export interface ModalOpts {
  title: string;
  /** Optional body copy under the title. */
  text?: string;
  button: string;
  /** Visual variant, used as a CSS hook (`modal--win`, `modal--hint`). */
  tone?: string;
  /** Slot for the panda illustration; omitted when not provided. */
  art?: HTMLElement;
}

/** Show a one-button dialog inside `parent`; resolves when the button is pressed and the dialog is removed. */
export function openModal(parent: HTMLElement, { title, text, button, tone = 'hint', art }: ModalOpts): Promise<void> {
  return new Promise((resolve) => {
    const btn = h(
      'button',
      {
        class: 'btn btn--primary modal__btn',
        type: 'button',
        onclick: () => {
          sfx.tick();
          overlay.remove();
          resolve();
        }
      },
      button
    );
    const card = h('div', { class: 'modal__card', role: 'dialog', 'aria-modal': 'true' }, [
      art ?? null,
      h('h2', { class: 'modal__title' }, title),
      text ? h('p', { class: 'modal__text' }, text) : null,
      btn
    ]);
    const overlay = h('div', { class: `modal modal--${tone}` }, [card]);
    parent.append(overlay);
    pop(card);
  });
}
