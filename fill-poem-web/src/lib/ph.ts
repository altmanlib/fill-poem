import { h } from './dom.ts';

export interface PhOpts {
  /** Stable asset key, e.g. `home/hero`. Used as data-asset and default label. */
  asset: string;
  className?: string;
  /** CSS aspect-ratio value, e.g. `1 / 1` or `16 / 9`. */
  ratio?: string;
  /** Optional image URL. When set, renders <img> instead of the dashed stub. */
  src?: string;
  alt?: string;
}

/**
 * Illustration slot. Without `src` it shows a dashed placeholder labeled by asset key.
 * Swap in real art later by passing `src` or replacing the node with an <img>.
 */
export function ph({ asset, className = '', ratio = '1 / 1', src, alt = '' }: PhOpts): HTMLElement {
  const el = h('div', {
    class: `ph${className ? ` ${className}` : ''}`,
    dataset: { asset }
  });
  el.style.aspectRatio = ratio;

  if (src) {
    el.append(h('img', { class: 'ph__img', src, alt: alt || asset }));
  } else {
    el.append(h('span', { class: 'ph__label' }, asset));
  }
  return el;
}
