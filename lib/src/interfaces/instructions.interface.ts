import { Block } from './statements.interface';
import { Token } from './token.interface';

export interface ResolvedTarget {
  fragments: string[];
  key: string;
  arg?: string;
}

interface BaseActionInstruction {
  kind: string;
  selectors: string[] | null;
  action: string;
  args: string[];
}

export interface BuiltInActionInstruction extends BaseActionInstruction {
  kind: 'builtin-action';
}

export interface BlockActionInstruction extends BaseActionInstruction {
  kind: 'block-action';
  block: Block;
  location: Token;
}

export type ActionInstruction =
  | BuiltInActionInstruction
  | BlockActionInstruction;

interface BaseAssertionInstruction {
  kind: string;
  target: ResolvedTarget[] | null;
  selectors: string[] | null;
  args: string[];
}

export interface CustomAssertion extends BaseAssertionInstruction {
  kind: 'custom-assertion';
  method: string;
}

export interface BuiltInAssertion extends BaseAssertionInstruction {
  kind: 'builtin-assertion';
  chainer: string;
}

export interface BlockAssertion extends BaseAssertionInstruction {
  kind: 'block-assertion';
  block: Block;
  location: Token;
}

export type AssertionInstruction =
  | CustomAssertion
  | BuiltInAssertion
  | BlockAssertion;

export interface SystemLevelInstruction {
  kind: 'system-level';
  key: string;
  args: string[];
}

export type Instruction =
  | ActionInstruction
  | AssertionInstruction
  | SystemLevelInstruction;

export interface Instructions {
  given: Instruction[];
  when: Instruction[];
  then: Instruction[];
}
