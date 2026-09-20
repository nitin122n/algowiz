/** Landing-page section where scrolling drives a real binary search, one step per stretch of scroll. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { binarySearch } from '../algorithms/searching/binary';
import { BarsView } from '../views/BarsView';

/** Sorted values and a target that takes a few halvings to find; the whole run is 9 steps, so the section stays short. */
const DATA = [3, 8, 12, 19, 25, 31, 44, 52, 60, 67, 73, 81, 88, 94, 99];
const TARGET = 73;
/** Scroll length per step, in viewport heights. */
const VH_PER_STEP = 18;

/**
 * A tall section with a sticky stage. While the section is on screen, an animation-frame loop reads how far
 * it has scrolled and maps that to a step index; React re-renders only when the step changes. The loop stops
 * when the section leaves the viewport.
 */
export function ScrollScrub() {
  const steps = useMemo(() => binarySearch.run({ array: DATA, target: TARGET }), []);
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = section.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let raf = 0;
    let last = -1;
    /** Reads scroll progress through the section and updates the step when it changes. */
    const tick = () => {
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(Math.max(-r.top / span, 0), 1) : 0;
      const i = Math.round(p * (steps.length - 1));
      if (i !== last) {
        last = i;
        setIndex(i);
        setProgress(p);
      }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [steps.length]);

  const step = steps[index];
  return (
    <section className="scrub-story" ref={section} style={{ height: `${100 + steps.length * VH_PER_STEP}vh` }} aria-label="Binary search, driven by scrolling">
      <div className="scrub-sticky">
        <div className="scrub-copy">
          <h2>One step, one sentence.</h2>
          <p className="scrub-lede">This section is the scrubber. Move down the page and the search moves with you, one recorded step at a time.</p>
          <p className="scrub-now" aria-live="off">{step.explain}</p>
          <ol className="code scrub-code" aria-hidden="true">
            {binarySearch.pseudocode.map((line, i) => (
              <li key={i} data-active={step.line === i}>
                <span className="ln">{i + 1}</span>
                <code>{line}</code>
              </li>
            ))}
          </ol>
        </div>
        <div className="scrub-stage">
          <header>
            <span>Binary Search</span>
            <span className="mono">target {TARGET}, step {index + 1} / {steps.length}</span>
          </header>
          <div>
            <BarsView array={step.state.array} marks={step.marks} target={TARGET} />
          </div>
          <div className="scrub-rail" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
