import { armEnter, fadeInUp } from '../anim/motion.ts';
import { config } from '../config.ts';
import { imageManifest } from '../lib/asset-manifest.ts';
import { h } from '../lib/dom.ts';
import { waitUntilReady } from '../lib/readiness.ts';
import { sfx } from '../lib/sfx.ts';
import type { PageContext, PageInstance } from '../types.ts';

// The splash stays at least this long; slower real loading takes priority.
const MIN_DURATION = config.loadingMs;

const FONT = { family: 'FZXiaoBiaoSong', sampleText: '竹林雅集国宝寻金' } as const;

const FAIL_COPY = '网络开小差了，请检查网络后重试';

export function createLoadingPage({ go }: PageContext): PageInstance {
  const fill = h('div', { class: 'loading__bar-fill' });
  const bar = h('div', { class: 'loading__bar' }, [fill]);
  const pct = h('p', { class: 'loading__pct' }, '0%');
  const failText = h('p', { class: 'loading__fail' }, FAIL_COPY);
  const retry = h('button', { class: 'btn btn--primary loading__retry', type: 'button', onclick: () => void attempt() }, '重试');
  const failBox = h('div', { class: 'loading__failbox' }, [failText, retry]);
  failBox.hidden = true;
  const el = h('div', { class: 'page page--loading' }, [bar, pct, failBox]);
  armEnter([bar, pct]);

  let destroyed = false;

  function setProgress(ratio: number): void {
    const p = Math.round(ratio * 100);
    fill.style.width = `${p}%`;
    pct.textContent = `${p}%`;
  }

  async function attempt(): Promise<void> {
    sfx.tick();
    failBox.hidden = true;
    bar.hidden = false;
    pct.hidden = false;
    setProgress(0);

    let loadRatio = 0;
    const start = performance.now();
    const shown = (): number => Math.min(Math.min(1, (performance.now() - start) / MIN_DURATION), loadRatio);

    // Shown progress is bounded by both elapsed time and real load ratio.
    let raf = 0;
    const tick = (): void => {
      setProgress(shown());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const result = await waitUntilReady(
      { images: imageManifest, font: FONT },
      {
        timeoutMs: config.loadingTimeoutMs,
        onProgress: (r) => {
          loadRatio = r;
        }
      }
    );
    if (destroyed) {
      cancelAnimationFrame(raf);
      return;
    }

    if (!result.ok) {
      cancelAnimationFrame(raf);
      bar.hidden = true;
      pct.hidden = true;
      failBox.hidden = false;
      return;
    }

    loadRatio = 1;
    while (!destroyed && shown() < 1) await new Promise((r) => requestAnimationFrame(r));
    cancelAnimationFrame(raf);
    if (destroyed) return;
    setProgress(1);
    void go('home', { transition: 'fade' });
  }

  return {
    el,
    enter() {
      fadeInUp([bar, pct], { distance: 14 });
      void attempt();
    },
    destroy() {
      destroyed = true;
    }
  };
}
