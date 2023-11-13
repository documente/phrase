export type Selector = string | ((...args: any[]) => string);

export interface PageObjectTree {
  _selector?: Selector;
  [key: string]: PageObjectTree | Selector | undefined;
}
