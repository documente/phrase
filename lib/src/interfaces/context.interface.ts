import { PageObjectTree } from './page-object-tree.interface';

export type SystemActions = {
  [key: string]: ((...args: unknown[]) => void) | string;
};

export interface Context {
  systemActions: SystemActions;
  pageObjectTree: PageObjectTree;
}

export type Externals = Record<string, () => void>;
