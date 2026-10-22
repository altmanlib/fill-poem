import { transitions } from '#/anim/transition.ts';
import { h, nextFrame } from '#/lib/dom.ts';
import type { PageContext, PageFactory, PageInstance, RouteName, TransitionName } from './types.ts';

interface RouterOpts {
  root: HTMLElement;
  routes: Record<RouteName, PageFactory>;
  ctx: Omit<PageContext, 'go' | 'data'>;
}

export interface Router {
  navigate: (name: RouteName, opts?: { transition?: TransitionName; data?: unknown }) => Promise<void>;
  readonly current: RouteName | null;
  /** The stage element pages render into — persistent chrome (brand logo, etc.) mounts here. */
  readonly viewport: HTMLElement;
}

// 极简页面路由：一个 viewport 内做单页切换 + 转场
export function createRouter({ root, routes, ctx }: RouterOpts): Router {
  const viewport = h('div', { class: 'viewport' });
  root.append(viewport);

  let current: PageInstance | null = null;
  let currentName: RouteName | null = null;
  let busy = false;

  // History guard: keep one entry ahead so the system back key triggers popstate
  // instead of leaving the app; the press is routed to the current page's back().
  history.pushState({ guard: true }, '');
  window.addEventListener('popstate', () => {
    history.pushState({ guard: true }, '');
    if (!busy) current?.back?.();
  });

  async function navigate(name: RouteName, { transition = 'fade', data }: { transition?: TransitionName; data?: unknown } = {}): Promise<void> {
    if (busy || name === currentName) return;
    const factory = routes[name];
    busy = true;

    const next = factory({ ...ctx, data, go: navigate });
    next.el.classList.add('page-layer');
    next.el.style.opacity = '0'; // 转场接管前先隐藏，避免新场景"就位闪现"
    viewport.append(next.el);
    await nextFrame();

    const prev = current;
    const runner = transitions[transition];
    await runner(prev?.el ?? null, next.el);

    if (prev) {
      await prev.leave?.();
      prev.destroy?.();
      prev.el.remove();
    }
    next.el.style.cssText = '';
    current = next;
    currentName = name;
    busy = false;

    await next.enter?.();
  }

  return {
    navigate,
    get current() {
      return currentName;
    },
    viewport
  };
}
