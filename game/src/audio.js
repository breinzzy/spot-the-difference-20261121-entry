// Synthesized sound effects with plain WebAudio — no audio files, no
// network. Every call is guarded: a browser that blocks audio (headless
// screenshots included) never breaks the game.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  tone(freq, dur, type = 'sine', vol = 0.16, when = 0, slideTo = null) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* audio is best-effort */
    }
  }

  click() {
    this.tone(660, 0.06, 'triangle', 0.08);
  }

  /** A bright two-note chime; higher streaks climb the scale. */
  found(streak = 1) {
    const base = 523 + Math.min(streak - 1, 6) * 40;
    this.tone(base, 0.14, 'sine', 0.18);
    this.tone(base * 1.5, 0.22, 'sine', 0.18, 0.09);
  }

  wrong() {
    this.tone(160, 0.22, 'sawtooth', 0.12, 0, 90);
  }

  hint() {
    this.tone(880, 0.1, 'sine', 0.12);
    this.tone(1174, 0.16, 'sine', 0.12, 0.08);
  }

  tick() {
    this.tone(1200, 0.05, 'square', 0.05);
  }

  win() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => this.tone(n, 0.22, 'triangle', 0.16, i * 0.11));
  }

  lose() {
    const notes = [392, 330, 262];
    notes.forEach((n, i) => this.tone(n, 0.25, 'triangle', 0.12, i * 0.14));
  }

  start() {
    this.tone(392, 0.1, 'triangle', 0.12);
    this.tone(523, 0.1, 'triangle', 0.12, 0.08);
    this.tone(659, 0.16, 'triangle', 0.14, 0.16);
  }
}
