import { PageObjectTree } from './page-object-tree.interface';

export type SystemActions = {
  [key: string]: (...args: unknown[]) => void;
};

export interface Context {
  systemActions: SystemActions;
  pageObjectTree: PageObjectTree;
}
