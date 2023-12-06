import { Block } from './statements.interface';
import { Token } from './token.interface';
import { BuiltinActionCode } from '../instructions-builder/builtin-actions';
import { BuiltinAssertionCode } from '../instructions-builder/builtin-assertions';

export interface ResolvedTarget {
  fragments: string[];
  key: string;
  arg?: string;
}

interface BaseActionInstruction {
  kind: string;
  selectors: string[] | null;
  args: string[];
}

export interface BuiltInActionInstruction extends BaseActionInstruction {
  kind: 'builtin-action';
  action: BuiltinActionCode;
}

export interface BlockActionInstruction extends BaseActionInstruction {
  kind: 'block-action';
  namedArguments: Record<string, string>;
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

export interface BuiltInAssertion extends BaseAssertionInstruction {
  kind: 'builtin-assertion';
  code: BuiltinAssertionCode;
}

export interface BlockAssertionInstruction extends BaseAssertionInstruction {
  kind: 'block-assertion';
  block: Block;
  location: Token;
  namedArguments: Record<string, string>;
}

export type AssertionInstruction = BuiltInAssertion | BlockAssertionInstruction;

export interface SystemLevelInstruction {
  kind: 'system-level';
  key: string;
  args: string[];
}

export type Instruction =
  | ActionInstruction
  | AssertionInstruction
  | SystemLevelInstruction;

export interface GivenWhenThenInstructions {
  given: Instruction[];
  when: Instruction[];
  then: Instruction[];
}
