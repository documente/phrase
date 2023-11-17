import {PageObjectTree} from './page-object-tree';

export type SystemActions = {
  [key: string]: Function;
};

export interface Context {
  systemActions: SystemActions;
  pageObjectTree: PageObjectTree;
}