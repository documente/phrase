import { Token } from './token.interface';

export interface ActionStatement {
  kind: 'action';
  tokens: Token[];
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
  kind: 'action-block';
}

export interface AssertionBlock extends BaseBlock {
  kind: 'assertion-block';
}

export type Block = ActionBlock | AssertionBlock;

export interface ParsedSentence {
  given: Statement[];
  when: Statement[];
  then: Statement[];
  blocks: Block[];
}
