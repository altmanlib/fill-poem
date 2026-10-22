import { bgm } from './lib/bgm.ts';
import { clearDebugParams, readDebugRoute } from './lib/debug.ts';
import { createStore } from './lib/store.ts';
import { createHomePage } from './pages/home.ts';
import { createLoadingPage } from './pages/loading.ts';
import { createRulesPage } from './pages/rules.ts';
import { createStagePage } from './pages/stage.ts';
import { createStubPage } from './pages/stub.ts';
import { createRouter } from './router.ts';
import type { AppState, PageFactory, RouteName } from './types.ts';

// Pages other than loading are stubs until their tasks land (see ROADMAP.md);
// each stub walks to the next route so the whole flow is clickable.
const routes: Record<RouteName, PageFactory> = {
  loading: createLoadingPage,
  home: createHomePage,
  rules: createRulesPage,
  stage: createStagePage,
  combine: createStubPage({ route: 'combine', title: '道具合成页', next: 'intro', transition: 'revealBurst' }),
  intro: createStubPage({ route: 'intro', title: '新品信息介绍页', next: 'lottery' }),
  lottery: createStubPage({ route: 'lottery', title: '抽奖页', next: 'lead' }),
  lead: createStubPage({ route: 'lead', title: '留资页', next: 'home' })
};

const INITIAL: AppState = { stage: 0, badges: 0 };

export function createApp(root: HTMLElement) {
  const store = createStore<AppState>(INITIAL);
  const router = createRouter({ root, routes, ctx: { store } });
  bgm.autoStart();

  async function start(): Promise<void> {
    if (import.meta.env.DEV) {
      const target = readDebugRoute(Object.keys(routes));
      if (target) {
        clearDebugParams();
        await router.navigate(target, { transition: 'fade' });
        return;
      }
    }
    await router.navigate('loading', { transition: 'fade' });
  }

  return { start, store, router };
}
