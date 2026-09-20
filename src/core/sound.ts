/** Optional step sounds: a short tone whose pitch follows the value being touched. */

/** Shared audio context, created on first use because browsers require a user gesture first. */
let ctx: AudioContext | null = null;

/**
 * Plays one short tone. Failures (no audio support, autoplay blocked) are ignored because sound is decoration.
 * @param freq - frequency in hertz
 * @param ms - duration in milliseconds
 */
export function tone(freq: number, ms = 90): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    // Quick fade in and out avoids clicks.
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000 + 0.02);
  } catch {
    /* audio unavailable */
  }
}

/**
 * Maps a value inside [min, max] to a pleasant pitch between 220 Hz and 880 Hz.
 * @param v - value
 * @param min - smallest value in the data
 * @param max - largest value in the data
 */
export function pitchFor(v: number, min: number, max: number): number {
  const t = max === min ? 0.5 : (v - min) / (max - min);
  return 220 * 2 ** (t * 2);
}
