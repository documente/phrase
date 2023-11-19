export type SelectorFn = (...args: unknown[]) => string;

export type Selector = string | SelectorFn;

export interface PageObjectTree {
  _selector?: Selector;
  [key: string]: PageObjectTree | Selector | undefined | SelectorFn;
}
