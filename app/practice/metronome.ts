// Web Audio metronome with the standard lookahead pattern: a coarse JS
// interval schedules sample-accurate clicks ~100ms ahead, so timing stays
// solid even when the main thread hiccups (especially on mobile).
export class Metronome {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private beat = 0;
  bpm = 100;
  beatsPerBar = 4;
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

  private click(time: number, accent: boolean) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1568 : 1046; // G6 / C6
    gain.gain.setValueAtTime(accent ? 0.5 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }
}
