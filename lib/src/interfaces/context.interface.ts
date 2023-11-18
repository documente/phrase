import { PageObjectTree } from './page-object-tree.interface';

export type SystemActions = {
  [key: string]: Function;
};

export interface Context {
  systemActions: SystemActions;
  pageObjectTree: PageObjectTree;
}
