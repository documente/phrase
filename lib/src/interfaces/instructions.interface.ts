export interface ResolvedTarget {
  fragments: string[];
  key: string;
  arg?: string;
}

export interface ActionInstruction {
  kind: 'action';
  target: string[] | null;
  action: string;
  args: string[];
}

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

export type ResolvedAssertion = CustomAssertion | BuiltInAssertion;

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

export interface Instructions {
  given: (ActionInstruction | SystemLevelInstruction)[];
  when: ActionInstruction[];
  then: AssertionInstruction[];
}
