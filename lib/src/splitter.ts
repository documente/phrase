import { Parser } from './parser';

export interface SplitResult {
  blocks: string[];
  tests: string[];
}

export class Splitter {
  strings: string[] = [];

  register(str: string) {
    this.strings.push(str);
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
