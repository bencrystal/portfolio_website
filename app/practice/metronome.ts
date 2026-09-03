// Web Audio metronome with the standard lookahead pattern: a coarse JS
// interval schedules sample-accurate clicks ~100ms ahead, so timing stays
// solid even when the main thread hiccups (especially on mobile).
export type ClickSound = "beep" | "wood" | "tick";

// Quick anchored release so a drone can be cut without a click.
function fadeOut(gain: GainNode, t: number) {
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(0.0001, t + 0.05);
}

export class Metronome {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private beat = 0;
  bpm = 100;
  beatsPerBar = 4;
  sound: ClickSound = "beep";
  volume = 1; // 0..1
  /** Fired (roughly) when each click sounds, for the visual pulse. */
  onBeat?: (beatInBar: number) => void;

  get running() {
    return this.timer !== null;
  }

  start() {
    if (this.timer) return;
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
    this.beat = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private schedule() {
    const ctx = this.ctx!;
    while (this.nextNoteTime < ctx.currentTime + 0.1) {
      const beatInBar = this.beat % this.beatsPerBar;
      this.click(this.nextNoteTime, beatInBar === 0);
      const delay = Math.max(0, (this.nextNoteTime - ctx.currentTime) * 1000);
      setTimeout(() => this.onBeat?.(beatInBar), delay);
      this.nextNoteTime += 60 / this.bpm;
      this.beat++;
    }
  }

  private droneGain: GainNode | null = null;

  /** Sustain the given pitch for one bar, retriggered on each downbeat. */
  playDrone(freq: number) {
    if (!this.ctx || !this.timer) return;
    const ctx = this.ctx;
    const time = ctx.currentTime;
    const dur = (60 / this.bpm) * this.beatsPerBar;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const level = Math.max(0.0001, 0.14 * this.volume);
    // Soft attack, hold for the bar, release just before the next downbeat.
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.05);
    gain.gain.setValueAtTime(level, Math.max(time + 0.05, time + dur - 0.15));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur + 0.02);
    if (this.droneGain) fadeOut(this.droneGain, time); // retrigger cuts the old tail
    this.droneGain = gain;
  }

  /** Silence the current drone immediately (mute button). */
  stopDrone() {
    if (!this.ctx || !this.droneGain) return;
    fadeOut(this.droneGain, this.ctx.currentTime);
    this.droneGain = null;
  }

  private click(time: number, accent: boolean) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Three synth flavors: pure sine beep, a duller woodblock-ish knock
    // (sine with a fast pitch drop), and a short bright tick.
    let level: number;
    let decay: number;
    if (this.sound === "wood") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(accent ? 880 : 660, time);
      osc.frequency.exponentialRampToValueAtTime(accent ? 440 : 330, time + 0.03);
      level = accent ? 0.7 : 0.45;
      decay = 0.045;
    } else if (this.sound === "tick") {
      osc.type = "square";
      osc.frequency.value = accent ? 2400 : 1800;
      level = accent ? 0.22 : 0.13;
      decay = 0.018;
    } else {
      osc.type = "sine";
      osc.frequency.value = accent ? 1568 : 1046; // G6 / C6
      level = accent ? 0.5 : 0.3;
      decay = 0.05;
    }
    gain.gain.setValueAtTime(level * this.volume || 0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + decay + 0.01);
  }
}
