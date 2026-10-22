import { bgm } from '#/lib/bgm.ts';
import { clearDebugParams, readDebugRoute } from '#/lib/debug.ts';
import { createStore } from '#/lib/store.ts';
import { createCombinePage } from '#/pages/combine.ts';
import { createHomePage } from '#/pages/home.ts';
import { createIntroPage } from '#/pages/intro.ts';
import { createLeadPage } from '#/pages/lead.ts';
import { createLoadingPage } from '#/pages/loading.ts';
import { createLotteryPage } from '#/pages/lottery.ts';
import { createRulesPage } from '#/pages/rules.ts';
import { createStagePage } from '#/pages/stage.ts';
import { createRouter } from './router.ts';
import type { AppState, PageFactory, RouteName } from './types.ts';

const routes: Record<RouteName, PageFactory> = {
  loading: createLoadingPage,
  home: createHomePage,
  rules: createRulesPage,
  stage: createStagePage,
  combine: createCombinePage,
  intro: createIntroPage,
  lottery: createLotteryPage,
  lead: createLeadPage
};

const INITIAL: AppState = { stage: 0, badges: 0, chances: 0 };

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
