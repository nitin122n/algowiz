import { str } from '../../core/forms';
import type { AlgorithmDef, FieldSpec, FormInput, Mark, Step, TreeNode, TreeState } from '../../core/step';
import { Rec } from '../../core/tracer';
import { theoryFor } from '../theory';

/** One trie node. `end` marks the last letter of a stored word. */
class TrieNode {
  children = new Map<string, TrieNode>();
  end = false;

  /** @param uid - stable id used by marks */
  constructor(readonly uid: number) {}
}

/** A trie that records steps; silent while building the starting words. */
class Trie {
  root = new TrieNode(0);
  silent = true;
  private next = 1;
  readonly rec = new Rec<TreeState>(['letters checked', 'memory']);

  /** Draws the trie. Children are ordered alphabetically. */
  state(): TreeState {
    const nodes: Record<number, TreeNode> = {};
    const walk = (n: TrieNode, label: string): void => {
      const kids = [...n.children.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
      nodes[n.uid] = { label, children: kids.map(([, c]) => c.uid), sub: n.end ? 'word' : undefined };
      kids.forEach(([ch, c]) => walk(c, ch));
    };
    walk(this.root, '·');
    return { nodes, roots: [0], binary: false };
  }

  /** Records a frame. */
  snap(marks: Mark[], line: number | null, explain: string): void {
    if (!this.silent) this.rec.snap(this.state(), marks, line, explain);
  }

  /** Inserts a word, one letter per frame. */
  insert(word: string): void {
    let n = this.root;
    this.snap([{ kind: 'active', index: 0 }], 0, `Insert "${word}" starting at the root.`);
    for (const ch of word) {
      if (!this.silent) this.rec.count('letters checked');
      let child = n.children.get(ch);
      if (child) {
        this.snap([{ kind: 'compare', index: child.uid }], 1, `"${ch}" already has a child here: follow it.`);
      } else {
        child = new TrieNode(this.next++);
        n.children.set(ch, child);
        this.snap([{ kind: 'insert', index: child.uid }], 2, `No child for "${ch}": create one.`);
      }
      n = child;
    }
    n.end = true;
    this.snap([{ kind: 'found', index: n.uid }], 3, `Mark this node as the end of "${word}".`);
  }
}

/** Form for the trie algorithms. */
function trieForm(valueLabel: string, value: string): FieldSpec[] {
  return [
    { key: 'words', label: 'Starting words', type: 'text', default: 'cat, car, cart, dog, do', help: 'Lowercase letters, separated by commas.', maxLength: 80 },
    { key: 'word', label: valueLabel, type: 'text', default: value, maxLength: 12 },
  ];
}

/** Splits and validates a comma list of words. */
function words(text: string): string[] {
  return text.split(/[,\s]+/).map((w) => w.trim().toLowerCase()).filter(Boolean);
}

/** Builds a trie definition. */
function defineTrie(id: string, name: string, summary: string, pseudocode: string[], valueLabel: string, value: string, run: (t: Trie, word: string) => void): AlgorithmDef<FormInput, TreeState> {
  return {
    id,
    name,
    family: 'tree',
    group: 'Tries',
    summary,
    complexity: { best: 'O(L)', average: 'O(L)', worst: 'O(L)', space: 'O(L)' },
    pseudocode,
    theory: theoryFor(id),
    input: {
      kind: 'form',
      maxSize: 100,
      defaultSize: 0,
      form: trieForm(valueLabel, value),
      randomize: (seed) => {
        const pool = ['tea', 'ten', 'to', 'inn', 'in', 'tin', 'tinker', 'sun', 'sunny', 'sum', 'apple', 'app', 'ape', 'bat', 'bath', 'bad'];
        const pick = pool.filter((_, i) => (i * 7 + seed) % 3 !== 0).slice(0, 6);
        return { words: pick.join(', '), word: pool[(seed * 5) % pool.length] };
      },
    },
    view: 'tree',
    run(input): Step<TreeState>[] {
      const t = new Trie();
      for (const w of words(str(input, 'words'))) t.insert(w);
      t.silent = false;
      const word = str(input, 'word').trim().toLowerCase();
      t.snap([], null, `Trie built from the starting words. ${name.includes('Insert') ? 'Insert' : 'Search for'} "${word}".`);
      run(t, word);
      return t.rec.steps;
    },
  };
}

/** Trie insert. */
export const trieInsert = defineTrie('trie-insert', 'Trie Insert', 'Follows or creates one child per letter, then marks the last node as the end of a word.', ['start at the root', 'for each letter: if the child exists, follow it', '  else create the child', 'mark the last node as a word end'], 'Word to insert', 'cane', (t, word) => t.insert(word));

/** Trie search. */
export const trieSearch = defineTrie('trie-search', 'Trie Search', 'Follows one child per letter. The word exists only if the path exists and ends on a word-end node.', ['start at the root', 'for each letter: follow its child, or stop: not found', 'if the last node is a word end: found', 'otherwise the word is only a prefix'], 'Word to find', 'car', (t, word) => {
  let n = t.root;
  t.snap([{ kind: 'active', index: 0 }], 0, 'Start at the root.');
  for (const ch of word) {
    const c = n.children.get(ch);
    t.rec.count('letters checked');
    if (!c) {
      t.snap([{ kind: 'notfound', index: n.uid }], 1, `No child for "${ch}": "${word}" is not in the trie.`);
      return;
    }
    n = c;
    t.snap([{ kind: 'compare', index: n.uid }], 1, `Follow "${ch}".`);
  }
  if (n.end) t.snap([{ kind: 'found', index: n.uid }], 2, `"${word}" ends on a word node: found.`);
  else t.snap([{ kind: 'notfound', index: n.uid }], 3, `The path for "${word}" exists, but it is only a prefix of longer words, not a stored word.`);
});
