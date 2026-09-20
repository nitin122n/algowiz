/**
 * Fixed decorative layer behind the whole app.
 * Codex (dark): a slowly turning gold sigil ring naming the eight families, a warm haze, and paper grain.
 * Dawn (light): two drifting pools of soft light over the mist gradient.
 * Pointer events are off and it is hidden from assistive technology.
 */

/** Family names written around the sigil ring. */
const RING = 'SORTING · SEARCHING · LINKED LISTS · GRAPHS · TREES · DYNAMIC PROGRAMMING · STRINGS · CLASSICS · ';

/** Renders the backdrop; CSS decides which parts each theme shows. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="bd-haze" />
      <div className="bd-orb bd-orb-a" />
      <div className="bd-orb bd-orb-b" />
      <svg className="bd-sigil" viewBox="0 0 400 400">
        <defs>
          <path id="bd-ring" d="M200 200 m-164 0 a164 164 0 1 1 328 0 a164 164 0 1 1 -328 0" />
        </defs>
        <circle cx="200" cy="200" r="190" />
        <circle cx="200" cy="200" r="178" />
        <circle cx="200" cy="200" r="148" />
        <circle cx="200" cy="200" r="96" />
        {Array.from({ length: 96 }, (_, i) => {
          const a = (i / 96) * Math.PI * 2;
          const long = i % 8 === 0;
          const r1 = 178;
          const r2 = long ? 166 : 172;
          return <line key={i} x1={200 + r1 * Math.cos(a)} y1={200 + r1 * Math.sin(a)} x2={200 + r2 * Math.cos(a)} y2={200 + r2 * Math.sin(a)} />;
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={`s${i}`} className="spoke" x1={200 + 96 * Math.cos(a)} y1={200 + 96 * Math.sin(a)} x2={200 + 148 * Math.cos(a)} y2={200 + 148 * Math.sin(a)} />;
        })}
        <polygon className="star" points={Array.from({ length: 8 }, (_, i) => { const a = (i * 3 * Math.PI * 2) / 8; return `${200 + 96 * Math.cos(a)},${200 + 96 * Math.sin(a)}`; }).join(' ')} />
        <text>
          <textPath href="#bd-ring" startOffset="0">{RING}</textPath>
        </text>
      </svg>
      <div className="bd-grain" />
    </div>
  );
}
