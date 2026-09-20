/** Bottom playback bar: transport buttons, scrubber, speed, loop, and sound. */
import { CaretLeft, CaretRight, Pause, Play, Repeat, SkipBack, SkipForward, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { SPEEDS, type Player } from './usePlayer';

/** Props for {@link PlayerDock}. */
interface PlayerDockProps {
  player: Player;
  /** Total number of steps. */
  length: number;
  /** Sound state; omit to hide the toggle. */
  sound?: boolean;
  onSound?: (on: boolean) => void;
}

/**
 * Transport controls. Every button has an accessible name and a tooltip with its shortcut.
 * @param props - player state, run length, and optional sound toggle
 */
export function PlayerDock({ player, length, sound, onSound }: PlayerDockProps) {
  const speedIdx = Math.max(SPEEDS.indexOf(player.speed as (typeof SPEEDS)[number]), 0);
  return (
    <div className="dock" role="group" aria-label="Playback controls">
      <div className="dock-buttons">
        <button className="icon-btn" onClick={player.first} disabled={player.atStart} aria-label="Back to start" title="Back to start (Home)">
          <SkipBack size={18} weight="bold" />
        </button>
        <button className="icon-btn" onClick={player.prev} disabled={player.atStart} aria-label="Previous step" title="Previous step (Left arrow)">
          <CaretLeft size={18} weight="bold" />
        </button>
        <button className="play-btn" onClick={player.toggle} aria-label={player.playing ? 'Pause' : 'Play'} title="Play or pause (Space)">
          {player.playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
          <span>{player.playing ? 'Pause' : player.atEnd ? 'Replay' : 'Play'}</span>
        </button>
        <button className="icon-btn" onClick={player.next} disabled={player.atEnd} aria-label="Next step" title="Next step (Right arrow)">
          <CaretRight size={18} weight="bold" />
        </button>
        <button className="icon-btn" onClick={player.last} disabled={player.atEnd} aria-label="Jump to end" title="Jump to end (End)">
          <SkipForward size={18} weight="bold" />
        </button>
      </div>
      <label className="scrub">
        <span className="sr-only">Step position</span>
        <input type="range" min={0} max={Math.max(length - 1, 0)} value={player.index} onChange={(e) => player.seek(Number(e.target.value))} style={{ ['--p' as string]: `${(100 * ((player.index) - (0))) / Math.max((length - 1) - (0), 1)}%` }} />
        <span className="scrub-count">
          {player.index + 1}<span className="dim"> / {length}</span>
        </span>
      </label>
      <label className="speed">
        <span>Speed</span>
        <input type="range" min={0} max={SPEEDS.length - 1} step={1} value={speedIdx} style={{ ['--p' as string]: `${(100 * ((speedIdx) - (0))) / Math.max((SPEEDS.length - 1) - (0), 1)}%` }} onChange={(e) => player.setSpeed(SPEEDS[Number(e.target.value)])} aria-valuetext={`${player.speed} times`} />
        <output>{player.speed}x</output>
      </label>
      <div className="dock-toggles">
        <button className="icon-btn" data-on={player.loop} aria-pressed={player.loop} onClick={() => player.setLoop(!player.loop)} aria-label="Loop" title="Loop playback">
          <Repeat size={18} weight="bold" />
        </button>
        {onSound && (
          <button className="icon-btn" data-on={!!sound} aria-pressed={!!sound} onClick={() => onSound(!sound)} aria-label="Sound" title="Sound: pitch follows the values">
            {sound ? <SpeakerHigh size={18} weight="bold" /> : <SpeakerSlash size={18} weight="bold" />}
          </button>
        )}
      </div>
    </div>
  );
}
