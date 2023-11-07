export interface Adapter {
  visit: (url: string) => void;
  select: (path: string[]) => TestElement;
  scrollIntoView: (element: TestElement) => void;
}

export interface TestElement {
  should: (...args) => any;
  type: (text: string) => void;
  trigger: (event: string) => void;
  click(): void;
}
