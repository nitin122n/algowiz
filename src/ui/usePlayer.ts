/** Playback state machine over a precomputed run of `length` steps. */
import { useCallback, useEffect, useState } from 'react';
import { clampIndex, stepDelayMs } from '../core/player';

/** Speed multipliers offered by the speed slider. */
export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;

/** Everything the player dock and keyboard handler need. */
export interface Player {
  index: number;
  playing: boolean;
  speed: number;
  loop: boolean;
  atStart: boolean;
  atEnd: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  seek: (i: number) => void;
  setSpeed: (s: number) => void;
  setLoop: (l: boolean) => void;
}

/**
 * Drives step playback: index, auto-play timer, speed, and looping.
 * @param length - number of steps in the current run
 * @param initial - starting step index (from the URL)
 * @returns controls and state for the UI
 */
export function usePlayer(length: number, initial = 0): Player {
  const [index, setIndex] = useState(() => clampIndex(initial, length));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const lastIdx = Math.max(length - 1, 0);

  // Keep the index valid if the run gets shorter.
  useEffect(() => {
    setIndex((i) => clampIndex(i, length));
  }, [length]);

  // Auto-play: schedule one step at a time so speed changes apply immediately.
  useEffect(() => {
    if (!playing) return;
    /** Advances one step, or stops or loops at the end of the run. */
    const id = window.setTimeout(() => {
      if (index >= lastIdx) {
        if (loop) setIndex(0);
        else setPlaying(false);
      } else {
        setIndex(index + 1);
      }
    }, stepDelayMs(speed));
    return () => window.clearTimeout(id);
  }, [playing, index, speed, loop, lastIdx]);

  const seek = useCallback((i: number) => setIndex(clampIndex(i, length)), [length]);
  const pause = useCallback(() => setPlaying(false), []);
  /** Starts playback; from the last step it restarts at step 0. */
  const play = useCallback(() => {
    // Pressing play on the last step restarts the run.
    if (index >= lastIdx) setIndex(0);
    setPlaying(true);
  }, [index, lastIdx]);

  return {
    index,
    playing,
    speed,
    loop,
    atStart: index <= 0,
    atEnd: index >= lastIdx,
    play,
    pause,
    /** Play when paused, pause when playing. */
    toggle: () => (playing ? pause() : play()),
    /** Pauses and moves one step forward. */
    next: () => {
      setPlaying(false);
      seek(index + 1);
    },
    /** Pauses and moves one step back. */
    prev: () => {
      setPlaying(false);
      seek(index - 1);
    },
    /** Pauses and jumps to the first step. */
    first: () => {
      setPlaying(false);
      seek(0);
    },
    /** Pauses and jumps to the last step. */
    last: () => {
      setPlaying(false);
      seek(lastIdx);
    },
    seek,
    setSpeed,
    setLoop,
  };
}
