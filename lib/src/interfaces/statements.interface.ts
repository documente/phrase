import { Token } from './token.interface';

export interface ActionStatement {
  kind: 'action';
  target: Token[];
  action: Token[];
  args: Token[];
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

interface BaseBlock {
  kind: string;
  header: Token[];
  body: Statement[];
}

export interface ActionBlock extends BaseBlock {
  kind: 'action';
}

export type Block = ActionBlock;

export interface ParsedSentence {
  given: Statement[];
  when: Statement[];
  then: Statement[];
  blocks: Block[];
}
