// Lightweight UI sound effects synthesized at runtime via Web Audio API —
// no audio asset files needed.
// AudioContext is lazily created (autoplay policy requires a user gesture) and every
// method no-ops safely when the API is unavailable (e.g. in jsdom test environment).

type ToneOptions = {
  type?: OscillatorType;
  gain?: number;
  duration?: number;
  at?: number;
};

class SfxPlayer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, { type = 'sine', gain = 0.15, duration = 0.08, at = 0 }: ToneOptions = {}): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const start = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }

  /** Light click feedback for button taps and option selection. */
  tick(): void {
    this.tone(800, { type: 'sine', gain: 0.35, duration: 0.05 });
  }

  /** Reward ping for a completed positive action (draw finished, form submitted). */
  coin(): void {
    this.tone(987.77, { type: 'triangle', gain: 0.4, duration: 0.15 }); // B5
  }

  /** Error buzz for validation failures. */
  buzzer(): void {
    this.tone(160, { type: 'sawtooth', gain: 0.35, duration: 0.2 });
  }

  /** Celebratory major chord for the hidden blind box reveal. */
  victoryChord(): void {
    for (const freq of [523.25, 659.25, 783.99, 1046.5]) this.tone(freq, { type: 'triangle', gain: 0.28, duration: 0.4 }); // C5-E5-G5-C6
  }
}

export const sfx = new SfxPlayer();
