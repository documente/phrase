import Chainable = Cypress.Chainable;

export interface Adapter {
  visit: (url: string) => void;
  select: (path: string[]) => Chainable;
  scrollIntoView: (element: Chainable) => void;
}
