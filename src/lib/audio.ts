/**
 * Tiny synthesised sound design (no audio files):
 * hangar drone, wind, light "clunks", whooshes and UI ticks.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private drone: GainNode | null = null;
  private wind: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private noise: AudioBuffer | null = null;
  enabled = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // Shared brown-noise buffer
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    this.noise = buf;

    // Hangar drone: low noise + two detuned sines
    this.drone = ctx.createGain();
    this.drone.gain.value = 0;
    this.drone.connect(this.master);
    const n = ctx.createBufferSource();
    n.buffer = buf;
    n.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    const ng = ctx.createGain();
    ng.gain.value = 0.55;
    n.connect(lp).connect(ng).connect(this.drone);
    n.start();
    for (const f of [55, 55.7, 110.4]) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = f > 100 ? 0.012 : 0.03;
      o.connect(g).connect(this.drone);
      o.start();
    }

    // Wind / altitude bed
    this.wind = ctx.createGain();
    this.wind.gain.value = 0;
    this.wind.connect(this.master);
    const wn = ctx.createBufferSource();
    wn.buffer = buf;
    wn.loop = true;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.value = 520;
    this.windFilter.Q.value = 0.6;
    wn.connect(this.windFilter).connect(this.wind);
    wn.start();
    return ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) {
      const ctx = this.ensure();
      void ctx.resume();
    }
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.25);
  }

  /** hangar 0..1, altitude 0..1 */
  setScene(hangar: number, altitude: number) {
    if (!this.ctx || !this.drone || !this.wind || !this.windFilter) return;
    const t = this.ctx.currentTime;
    this.drone.gain.setTargetAtTime(0.5 * hangar, t, 0.3);
    this.wind.gain.setTargetAtTime(0.32 * altitude, t, 0.3);
    this.windFilter.frequency.setTargetAtTime(380 + altitude * 700, t, 0.4);
  }

  clunk(strength = 1) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * strength, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random() * 2, 0.25);

    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.7 * strength, t + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(og).connect(this.master!);
    o.start(t);
    o.stop(t + 0.4);
  }

  whoosh(duration = 1.4, up = true) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(up ? 260 : 1800, t);
    f.frequency.exponentialRampToValueAtTime(up ? 2200 : 240, t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.1, t + duration * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random(), duration + 0.1);
  }

  tick() {
    if (!this.enabled) return;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = 1650;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.08);
  }
}

export const audio = new AudioEngine();
