import { ResolvedTarget } from './instructions.interface';

export interface TargetSelector {
  selectors: string[];
  path: ResolvedTarget[];
}
