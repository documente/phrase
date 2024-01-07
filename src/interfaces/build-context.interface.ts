import { ResolvedTarget } from './instructions.interface';
import { Block } from './statements.interface';
import { SelectorTree } from './selector-tree.interface';
import { Externals } from './externals.interface';

export interface BuildContext {
  previousPath: ResolvedTarget[];
  selectorTree: SelectorTree;
  externals: Externals;
  blocks: Block[];
  input: string;
  envVars: Record<string, string>;
}
