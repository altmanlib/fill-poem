import { armEnter, fadeInUp } from '../anim/motion.ts';
import { config } from '../config.ts';
import { imageManifest } from '../lib/asset-manifest.ts';
import { h } from '../lib/dom.ts';
import { preloadImages } from '../lib/preload.ts';
import type { PageContext, PageInstance } from '../types.ts';

// The splash stays at least this long; slower real loading takes priority.
const MIN_DURATION = config.loadingMs;

export function createLoadingPage({ go }: PageContext): PageInstance {
  const fill = h('div', { class: 'loading__bar-fill' });
  const bar = h('div', { class: 'loading__bar' }, [fill]);
  const pct = h('p', { class: 'loading__pct' }, '0%');
  const el = h('div', { class: 'page page--loading' }, [bar, pct]);
  armEnter([bar, pct]);

  return {
    el,
    async enter() {
      fadeInUp([bar, pct], { distance: 14 });

      let loadRatio = 0;
      void preloadImages(imageManifest, (ratio) => {
        loadRatio = ratio;
      });

      const start = performance.now();
      await new Promise<void>((resolve) => {
        const tick = (): void => {
          const timeRatio = Math.min(1, (performance.now() - start) / MIN_DURATION);
          // Shown progress is bounded by both elapsed time and real load ratio.
          const p = Math.min(timeRatio, loadRatio);
          fill.style.width = `${Math.round(p * 100)}%`;
          pct.textContent = `${Math.round(p * 100)}%`;
          if (p < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      void go('home', { transition: 'fade' });
    }
  };
}
