import { ResolvedTarget } from './instructions.interface';
import { Context } from './context.interface';
import { Block } from './statements.interface';

export interface BuildContext {
  previousPath: ResolvedTarget[];
  testContext: Context;
  blocks: Block[];
  input: string;
}
