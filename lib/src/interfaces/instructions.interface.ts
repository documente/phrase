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
  kind: 'builtin';
}

export interface BlockActionInstruction extends BaseActionInstruction {
  kind: 'block';
  block: Block;
  location: Token;
}

export type ActionInstruction =
  | BuiltInActionInstruction
  | BlockActionInstruction;

interface BaseResolvedAssertion {
  kind: string;
}

export interface CustomAssertion extends BaseResolvedAssertion {
  kind: 'custom';
  method: string;
}

export interface BuiltInAssertion extends BaseResolvedAssertion {
  kind: 'builtin';
  chainer: string;
}

export interface BlockAssertion extends BaseResolvedAssertion {
  kind: 'block';
  block: Block;
  location: Token;
}

export type ResolvedAssertion =
  | CustomAssertion
  | BuiltInAssertion
  | BlockAssertion;

export interface AssertionInstruction {
  kind: 'assertion';
  target: ResolvedTarget[] | null;
  selectors: string[] | null;
  assertion: ResolvedAssertion;
  args: string[];
}

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
