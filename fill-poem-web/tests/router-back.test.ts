import { expect, test, vi } from 'vitest';
import { createRouter } from '../src/router.ts';
import type { PageFactory } from '../src/types.ts';

function setup(back?: () => void) {
  const page: PageFactory = () => ({ el: document.createElement('div'), back });
  const root = document.createElement('div');
  document.body.append(root);
  const router = createRouter({
    root,
    routes: { loading: page, home: page, rules: page, stage: page, combine: page, intro: page, lottery: page, lead: page },
    ctx: { store: { get: () => ({ stage: 0, badges: 0 }), set: () => {}, subscribe: () => () => {} } }
  });
  return router;
}

test('system back is routed to the current page and keeps a guard entry', async () => {
  const back = vi.fn();
  const router = setup(back);
  await router.navigate('rules', { transition: 'fade' });
  const before = history.length;
  window.dispatchEvent(new PopStateEvent('popstate'));
  expect(back).toHaveBeenCalledTimes(1);
  expect(history.length).toBe(before + 1);
});

test('page without back() swallows the key', async () => {
  const router = setup();
  await router.navigate('stage', { transition: 'fade' });
  expect(() => window.dispatchEvent(new PopStateEvent('popstate'))).not.toThrow();
});
