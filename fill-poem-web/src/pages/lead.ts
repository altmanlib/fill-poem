import { armEnter, fadeInUp } from '#/anim/motion.ts';
import { type LeadForm, validateLead } from '#/game/lead-form.ts';
import { h } from '#/lib/dom.ts';
import { openModal } from '#/lib/modal.ts';
import { sfx } from '#/lib/sfx.ts';
import type { PageContext, PageInstance } from '#/types.ts';

const NOTES = [
  '请认真填写收货信息，确保奖品准确送达',
  '获奖用户须在活动上线期间（2026年X月X日 0:00 – 2026年X月X日 24:00）提交领奖信息，逾期提交或不填写视为放弃奖品',
  '领奖信息可重复进入修改，以最终提交为准'
];

const FIELDS: ReadonlyArray<{ key: keyof LeadForm; label: string; type: string; autocomplete: string }> = [
  { key: 'name', label: '姓名', type: 'text', autocomplete: 'name' },
  { key: 'phone', label: '电话', type: 'tel', autocomplete: 'tel' },
  { key: 'address', label: '地址', type: 'text', autocomplete: 'street-address' }
];

export function createLeadPage({ go }: PageContext): PageInstance {
  const title = h('h1', { class: 'lead__title' }, '填写获奖信息');
  const inputs = new Map<keyof LeadForm, HTMLInputElement>();
  const errors = new Map<keyof LeadForm, HTMLElement>();
  const rows = FIELDS.map((f) => {
    const input = h('input', { class: 'lead__input', type: f.type, name: f.key, autocomplete: f.autocomplete, maxlength: f.key === 'phone' ? 11 : 100 });
    const error = h('span', { class: 'lead__error' });
    inputs.set(f.key, input);
    errors.set(f.key, error);
    return h('label', { class: 'lead__row' }, [h('span', { class: 'lead__label' }, f.label), input, error]);
  });
  const notes = h(
    'ol',
    { class: 'lead__notes' },
    NOTES.map((n) => h('li', {}, n))
  );
  const save = h('button', { class: 'btn btn--primary', type: 'button', onclick: () => void onSave() }, '保存信息');
  const el = h('div', { class: 'page page--lead' }, [title, ...rows, notes, save]);
  const targets = [title, ...rows, notes, save];
  armEnter(targets);

  async function onSave(): Promise<void> {
    const form: LeadForm = { name: inputs.get('name')?.value ?? '', phone: inputs.get('phone')?.value ?? '', address: inputs.get('address')?.value ?? '' };
    const result = validateLead(form);
    for (const f of FIELDS) {
      const err = errors.get(f.key);
      if (err) err.textContent = result[f.key] ?? '';
    }
    if (Object.keys(result).length > 0) return;
    sfx.tick();
    // Submission goes to the API in R018; until then the form is validated only.
    await openModal(el, { title: '保存成功', text: '领奖信息可重复进入修改，以最终提交为准', button: '好的' });
    void go('lottery');
  }

  return {
    el,
    enter() {
      fadeInUp(targets, { distance: 14 });
    },
    back() {
      void go('home');
    }
  };
}
