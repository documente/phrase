import { Parser } from './parser';
import { normalizeEOL } from './normalize-eol';

export interface SplitResult {
  blocks: string[];
  tests: string[];
}

export class Splitter {
  strings: string[] = [];

  add(str: string) {
    this.strings.push(normalizeEOL(str));
  }

  split(): SplitResult {
    const all = this.strings.join('\n');
    const blocks: string[] = [];
    const tests: string[] = [];
    const parsed = new Parser().parse(all);

    for (const section of parsed) {
      if (section.kind === 'given-when-then') {
        tests.push(section.source);
      } else {
        blocks.push(section.source);
      }
    }

    return { blocks, tests };
  }
}
