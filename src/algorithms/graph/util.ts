/** Shared graph plumbing: edge-list parsing, circular layout, random graphs, and the step recorder. */
import { InputError, int, str } from '../../core/forms';
import { mulberry32 } from '../../core/random';
import { edgeKey, type AlgorithmDef, type Complexity, type FieldSpec, type FormInput, type GraphState, type Mark, type MarkKind, type ScaleSpec, type Step } from '../../core/step';
import { shape, spread } from '../../core/scale';
import { Rec } from '../../core/tracer';
import { theoryFor } from '../theory';

/** One edge of a parsed graph. */
export interface Edge {
  u: number;
  v: number;
  w: number;
}

/** A parsed graph with adjacency lists. `edge` in an adjacency entry indexes `edges`. */
export interface Graph {
  n: number;
  edges: Edge[];
  adj: Array<Array<{ to: number; w: number; edge: number }>>;
  directed: boolean;
  weighted: boolean;
  source: number;
}

/** Largest number of nodes the circular layout draws legibly. */
export const MAX_NODES = 10;

/**
 * Letter label for a node.
 * @param i - node index
 * @returns "A" for 0, "B" for 1, ...
 */
export const L = (i: number): string => String.fromCharCode(65 + i);

/** Converts "A" or "3" to a node index, or -1 when the token is not a node. */
function nodeIndex(tok: string): number {
  if (/^[A-Za-z]$/.test(tok)) return tok.toUpperCase().charCodeAt(0) - 65;
  return /^\d+$/.test(tok) ? Number(tok) : -1;
}

/**
 * Parses an edge list such as "A-B:4, B-C:2" into a graph.
 * @param input - parsed form with `n`, `edges`, and `source`
 * @param directed - edges point from left to right when true
 * @param weighted - keep the `:w` weights (otherwise every weight is 1)
 * @returns the graph
 * @throws InputError when a token is malformed, a node is out of range, or an edge repeats
 */
export function parseGraph(input: FormInput, directed: boolean, weighted: boolean): Graph {
  const n = int(input, 'n');
  const text = str(input, 'edges').trim();
  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (const tok of text.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean)) {
    const m = /^([A-Za-z]|\d+)\s*(?:->|>|-)\s*([A-Za-z]|\d+)(?::\s*(-?\d+))?$/.exec(tok);
    if (!m) throw new InputError(`"${tok}" is not an edge. Write edges like A-B or A-B:4.`);
    const u = nodeIndex(m[1]);
    const v = nodeIndex(m[2]);
    if (u < 0 || v < 0 || u >= n || v >= n) throw new InputError(`Edge "${tok}" uses a node outside A..${L(n - 1)}.`);
    if (u === v) throw new InputError(`Edge "${tok}" connects a node to itself.`);
    const key = edgeKey(u, v, directed);
    if (seen.has(key)) throw new InputError(`Edge "${tok}" appears twice.`);
    seen.add(key);
    edges.push({ u, v, w: weighted && m[3] !== undefined ? Number(m[3]) : 1 });
  }
  const source = int(input, 'source');
  if (source >= n) throw new InputError(`Start node must be between 0 and ${n - 1}.`);
  const adj: Graph['adj'] = Array.from({ length: n }, () => []);
  edges.forEach((e, edge) => {
    adj[e.u].push({ to: e.v, w: e.w, edge });
    if (!directed) adj[e.v].push({ to: e.u, w: e.w, edge });
  });
  return { n, edges, adj, directed, weighted, source };
}

/**
 * Builds a seeded random edge list.
 * @param seed - random seed
 * @param n - node count
 * @param o - `weighted` adds weights, `acyclic` keeps edges pointing from lower to higher index, `negative` allows some negative weights
 * @param extra - how many extra edges to try beyond the connecting chain (default n)
 * @returns edge-list text
 */
export function randomEdges(seed: number, n: number, o: { weighted?: boolean; acyclic?: boolean; negative?: boolean; directed?: boolean }, extra = n): string {
  const rnd = mulberry32(seed);
  const out: string[] = [];
  const used = new Set<string>();
  const add = (a: number, b: number) => {
    const key = o.directed ? `${a}>${b}` : `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (a === b || used.has(key)) return;
    used.add(key);
    let w = 1 + Math.floor(rnd() * 9);
    if (o.negative && rnd() < 0.25 && a < b) w = -1 - Math.floor(rnd() * 3);
    out.push(`${L(a)}-${L(b)}${o.weighted ? `:${w}` : ''}`);
  };
  // A spanning chain guarantees the graph is connected from node 0.
  for (let i = 1; i < n; i++) add(o.acyclic || o.directed ? Math.floor(rnd() * i) : Math.floor(rnd() * i), i);
  for (let k = 0; k < extra; k++) {
    let a = Math.floor(rnd() * n);
    let b = Math.floor(rnd() * n);
    if (o.acyclic && a > b) [a, b] = [b, a];
    add(a, b);
  }
  return out.join(', ');
}

/** Options for {@link graphInput}. */
interface GraphInputOpts {
  n: number;
  edges: string;
  weighted?: boolean;
  directed?: boolean;
  acyclic?: boolean;
  negative?: boolean;
  /** Hide the start-node field (algorithms that do not need one). */
  noSource?: boolean;
}

/**
 * Builds the form fields and random generator shared by graph algorithms.
 * @param o - default graph and how random graphs should look
 * @returns `form` and `randomize` for an InputSpec
 */
export function graphInput(o: GraphInputOpts): { form: FieldSpec[]; randomize: (seed: number) => Record<string, string>; scale: ScaleSpec<FormInput> } {
  const form: FieldSpec[] = [
    { key: 'n', label: 'Nodes', type: 'int', default: o.n, min: 2, max: MAX_NODES },
    { key: 'edges', label: 'Edges', type: 'text', default: o.edges, help: `Like A-B${o.weighted ? ':4' : ''}, separated by commas.${o.directed ? ' A-B means A points to B.' : ''}` },
  ];
  if (!o.noSource) form.push({ key: 'source', label: 'Start node (0 is A)', type: 'int', default: 0, min: 0, max: MAX_NODES - 1 });
  return {
    form,
    randomize: (seed) => {
      const n = 6 + (seed % 3);
      return { n: String(n), edges: randomEdges(seed, n, o), source: '0' };
    },
    scale: {
      sizes: spread(3, MAX_NODES),
      unit: 'nodes',
      shapes: [shape('sparse', 'Sparse graph (about 1.5 edges per node)', 3), shape('dense', 'Dense graph (about 3 edges per node)', 3)],
      make: (n, s, seed) => ({ n, edges: randomEdges(seed * 31 + n, n, o, s === 'dense' ? 2 * n : Math.ceil(n / 2)), source: 0 }),
      sizeOf: (i) => Number(i.n),
    },
  };
}

/** Records a graph algorithm's run with per-node kinds, captions, and marked edges. */
export class GraphRec {
  readonly rec: Rec<GraphState>;
  /** Highlight kind per node (null draws it plain). */
  kinds: Array<MarkKind | null>;
  /** Caption under each node (distance, discovery time ...). */
  sub: string[];
  /** Highlight per edge, keyed by {@link edgeKey}. */
  edgeMarks: Record<string, MarkKind> = {};

  /**
   * @param g - the graph being drawn
   * @param counters - names of counters to show
   */
  constructor(
    readonly g: Graph,
    counters: string[],
  ) {
    this.rec = new Rec<GraphState>(counters);
    this.kinds = Array(g.n).fill(null);
    this.sub = Array(g.n).fill('');
  }

  /** The recorded steps. */
  get steps(): Step<GraphState>[] {
    return this.rec.steps;
  }

  /** Increases a counter. */
  count(name: string, by = 1): void {
    this.rec.count(name, by);
  }

  /** Raises a counter to at least `value`. */
  raise(name: string, value: number): void {
    this.rec.raise(name, value);
  }

  /** Records `cells` extra memory in use (arrays, queue entries). */
  alloc(cells: number): void {
    this.rec.alloc(cells);
  }

  /** Releases `cells` extra memory. */
  free(cells: number): void {
    this.rec.free(cells);
  }

  /** Records entering one recursive call. */
  enter(): void {
    this.rec.enter();
  }

  /** Records returning from a recursive call. */
  leave(): void {
    this.rec.leave();
  }

  /**
   * Marks or clears an edge.
   * @param u - one endpoint
   * @param v - other endpoint
   * @param kind - mark to apply, or null to clear
   */
  edge(u: number, v: number, kind: MarkKind | null): void {
    const key = edgeKey(u, v, this.g.directed);
    if (kind) this.edgeMarks[key] = kind;
    else delete this.edgeMarks[key];
  }

  /**
   * Shows one frame with an edge temporarily highlighted, then restores its previous mark.
   * @param u - one endpoint
   * @param v - other endpoint
   * @param kind - temporary mark
   * @param line - active pseudocode line
   * @param explain - sentence for the frame
   */
  flash(u: number, v: number, kind: MarkKind, line: number | null, explain: string): void {
    const key = edgeKey(u, v, this.g.directed);
    const prev = this.edgeMarks[key];
    this.edgeMarks[key] = kind;
    this.snap(line, explain);
    if (prev) this.edgeMarks[key] = prev;
    else delete this.edgeMarks[key];
  }

  /**
   * Pushes a frame with the current kinds, captions, and edge marks.
   * @param line - active pseudocode line
   * @param explain - sentence for this frame
   * @param extra - extra node marks (labels such as "src")
   */
  snap(line: number | null, explain: string, extra: Mark[] = []): void {
    const { g } = this;
    const marks: Mark[] = [];
    this.kinds.forEach((k, index) => k && marks.push({ kind: k, index }));
    this.rec.snap(
      {
        nodes: Array.from({ length: g.n }, (_, i) => {
          const a = 2 * Math.PI * (i / g.n) - Math.PI / 2;
          return { x: 50 + 38 * Math.cos(a), y: 50 + 38 * Math.sin(a), label: L(i), sub: this.sub[i] || undefined };
        }),
        edges: g.edges.map((e) => ({ from: e.u, to: e.v, w: g.weighted ? e.w : undefined })),
        directed: g.directed,
        weighted: g.weighted,
        edgeMarks: { ...this.edgeMarks },
      },
      [...marks, ...extra],
      line,
      explain,
    );
  }
}

/** Fields a graph algorithm file provides. */
export interface GraphSpec {
  id: string;
  name: string;
  group: string;
  summary: string;
  complexity: Complexity;
  pseudocode: string[];
  input: ReturnType<typeof graphInput>;
  run: (input: FormInput) => Step<any>[];
  /** Override the view (Floyd-Warshall draws a table). */
  view?: AlgorithmDef['view'];
}

/**
 * Builds a definition for a graph algorithm.
 * @param s - algorithm-specific fields
 * @returns a registry-ready definition
 */
export function defineGraph(s: GraphSpec): AlgorithmDef<FormInput, unknown> {
  return {
    id: s.id,
    name: s.name,
    family: 'graph',
    group: s.group,
    summary: s.summary,
    complexity: s.complexity,
    pseudocode: s.pseudocode,
    theory: theoryFor(s.id),
    input: { kind: 'form', maxSize: 100, defaultSize: 0, form: s.input.form, randomize: s.input.randomize },
    run: s.run,
    view: s.view ?? 'graph',
    scale: s.input.scale,
  };
}
