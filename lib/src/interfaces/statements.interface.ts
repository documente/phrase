import { Token } from './token.interface';

export interface ActionStatement {
  kind: 'action';
  target: Token[];
  action: Token[];
  args: any[];
}

export interface AssertionStatement {
  kind: 'assertion';
  target: Token[];
  assertion: Token[];
  args: Token[];
  firstToken: Token;
}

export interface SystemLevelStatement {
  kind: 'system-level';
  tokens: Token[];
  args: Token[];
}

export type Statement =
  | ActionStatement
  | AssertionStatement
  | SystemLevelStatement;

export interface ParsedSentence {
  given: Statement[];
  when: Statement[];
  then: Statement[];
  blocks: {
    [key: string]: Statement[];
  };
}
