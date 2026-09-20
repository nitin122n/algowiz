/** A small, non-interactive, looping preview of a real algorithm run, used on the landing page. */
import { useEffect, useMemo } from 'react';
import { REGISTRY } from '../algorithms';
import { StageView } from '../views/StageView';
import { defaultInput } from './inputs';
import { useInView } from './useInView';
import { usePlayer } from './usePlayer';
import { trackIds } from '../core/identity';

/** Props for {@link MiniStage}. */
interface MiniStageProps {
  /** Algorithm id to preview. */
  id: string;
  /** Playback speed multiplier. */
  speed?: number;
  /** Element count for array algorithms. */
  size?: number;
  /** Show the explanation sentence under the view. */
  caption?: boolean;
}

/**
 * Runs the algorithm once on its default input and loops the result. It pauses while off screen.
 * Hidden from assistive technology because the same content is available on the algorithm's own page.
 * @param props - algorithm id and playback options
 */
export function MiniStage({ id, speed = 3, size, caption = false }: MiniStageProps) {
  const def = REGISTRY.get(id);
  const steps = useMemo(() => (def ? def.run(defaultInput(def, size)) : []), [def, size]);
  const ids = useMemo(() => (def?.view === 'bars' ? trackIds(steps.map((s) => (s.state as { array: number[] }).array)) : null), [def, steps]);
  const [ref, inView] = useInView<HTMLDivElement>();
  const player = usePlayer(steps.length);
  const { play, pause, setSpeed, setLoop } = player;
  useEffect(() => {
    setSpeed(speed);
    setLoop(true);
  }, [speed, setSpeed, setLoop]);
  useEffect(() => (inView ? play() : pause()), [inView, play, pause]);
  if (!def || !steps.length) return null;
  const step = steps[player.index];
  return (
    <div className="mini" ref={ref} aria-hidden="true" style={{ ['--move' as string]: `${Math.round(Math.min(300, 700 / speed))}ms` }}>
      <StageView def={def} step={step} ids={ids?.[player.index]} />
      {caption && <p className="mini-caption">{step.explain}</p>}
    </div>
  );
}
