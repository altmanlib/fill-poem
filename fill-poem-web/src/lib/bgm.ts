// Background music: a single looped track plays softly behind the whole flow.
// Track path / volume come from src/config.ts (VITE_BGM_TRACK).
// bgm.autoStart() tries to play as soon as the page loads and re-tries on the
// WeChat JS bridge / first gesture as a fallback when the browser's autoplay
// policy blocks the initial attempt (mobile Chrome/WeChat Android).

import { config } from '#/config.ts';

class BgmPlayer {
  private audio: HTMLAudioElement | null = null;
  private _playing = false;

  private ensureAudio(): HTMLAudioElement | null {
    if (this.audio) return this.audio;
    if (typeof Audio === 'undefined') return null;
    const audio = new Audio(config.bgm.trackUrl);
    audio.loop = true;
    audio.volume = config.bgm.volume;
    audio.preload = 'auto';
    this.audio = audio;
    return audio;
  }

  /** Start (or resume) playback. Safe to call speculatively — rejects silently if blocked. */
  async start(): Promise<void> {
    const audio = this.ensureAudio();
    if (!audio) return;
    try {
      await audio.play();
      this._playing = true;
    } catch {
      // Autoplay blocked, or media unsupported in the current environment
      // (e.g. jsdom tests) — fail silently.
      this._playing = false;
    }
  }

  /**
   * Best-effort autoplay on page load. WeChat iOS usually succeeds as soon as
   * the JS bridge is ready; WeChat Android and most other mobile browsers
   * block autoplay until a genuine gesture, so this also arms one-shot
   * gesture listeners as a fallback. Silent no-op if audio is unavailable
   * (e.g. tests).
   */
  autoStart(): void {
    if (typeof document === 'undefined') return;
    void this.start();
    const retry = (): void => {
      if (!this._playing) void this.start();
    };
    document.addEventListener('WeixinJSBridgeReady', retry, { once: true });
    for (const evt of ['touchstart', 'pointerdown', 'click']) {
      document.addEventListener(evt, retry, { once: true, passive: true });
    }
  }
}

export const bgm = new BgmPlayer();
