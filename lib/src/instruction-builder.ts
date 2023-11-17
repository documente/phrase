import {ActionStatement, Parser, Sentence, SystemLevelStatement} from './parser';
import { resolve, ResolvedTarget } from './resolver';
import { prettyPrintError } from './error';
import { isBuiltinAction } from './builtin-actions';
import { unquoted } from './quoted-text';
import { PageObjectTree, Selector } from './page-object-tree';
import { Token } from './tokenizer';
import { KnownChainer } from './known-chainers';
import { getNode } from './get-node';
import {Context} from './context.interface';

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

export function buildInstructions(
  input: string,
  context: Context,
): Instructions {
  const tree = context.pageObjectTree;
  const parser = new Parser();
  const sentenceTree: Sentence = parser.parse(input);

  let previousPath: ResolvedTarget[] = [];

  const givenInstructions: (ActionInstruction | SystemLevelInstruction)[] = [];

  sentenceTree.prerequisites.forEach((statement) => {
    if (statement.kind === 'system-level') {
      givenInstructions.push(extractSystemLevelInstruction(context, statement, input));
    } else {
      const {previousPath: path, instruction} = extractAction(tree, statement, previousPath, input);
      givenInstructions.push(instruction);
      if (path) {
        previousPath = path;
      }
    }
  });

  const whenInstructions: ActionInstruction[] = [];

  sentenceTree.actions.forEach((action) => {
    const {previousPath: path, instruction} = extractAction(tree, action, previousPath, input);
    whenInstructions.push(instruction);
    if (path) {
      previousPath = path;
    }
  });

  const assertions: AssertionInstruction[] = [];

  sentenceTree.assertions.forEach((assertion) => {
    const resolved = extractTargetSelector(
      tree,
      assertion.target,
      previousPath,
      input,
    );

    if (resolved?.path) {
      previousPath = resolved.path;
    }

    const selectors = resolved?.selectors ?? null;
    const assertionName = assertion.assertion.map((a) => a.value).join(' ');
    const resolvedAssertion = resolveAssertion(
      resolved?.path,
      tree,
      assertionName,
      input,
      assertion.firstToken,
    );
    const args = assertion.args.map((arg) => unquoted(arg.value));

    assertions.push({
      kind: 'assertion',
      target: resolved?.path ?? null,
      selectors,
      assertion: resolvedAssertion,
      args,
    });
  });

  return {
    given: givenInstructions,
    when: whenInstructions,
    then: assertions,
  };
}

function extractAction(
  tree: PageObjectTree,
  actionStatement: ActionStatement,
  previousPath: ResolvedTarget[],
  input: string,
): {previousPath: ResolvedTarget[], instruction: ActionInstruction} {
  const resolved = extractTargetSelector(
    tree,
      actionStatement.target,
    previousPath,
    input,
  );
  const target = resolved?.selectors ?? null;
  if (resolved?.path) {
    previousPath = resolved.path;
  }
  const actionName = extractActionInstruction(actionStatement, input);
  const args = actionStatement.args.map((arg) => unquoted(arg.value));

  const instruction: ActionInstruction = {
    kind: 'action',
    target,
    action: actionName,
    args,
  };
  return {previousPath, instruction};
}

function extractActionInstruction(action: ActionStatement, input: string) {
  const actionName = action.action.map((a) => a.value).join(' ');

  if (!isBuiltinAction(actionName)) {
    throw new Error(
      prettyPrintError(
        `Unknown action "${actionName}"`,
        input,
        action.action[0],
      ),
    );
  }
  return actionName;
}

function extractTargetSelector(
  tree: PageObjectTree,
  target: Token[],
  previousPath: ResolvedTarget[],
  input: string,
) {
  if (target.length === 0) {
    return null;
  }

  if (target.length === 1 && target[0].value === 'it') {
    return {
      selectors: buildSelectors(tree, previousPath, target, input),
      path: previousPath,
    };
  }

  const targetFragments = target.map((t) => t.value);

  const targetPath = resolve(tree, targetFragments, previousPath);

  if (!targetPath) {
    throw new Error(
      prettyPrintError(
        `Could not resolve target path for "${target
          .map((t) => t.value)
          .join(' ')}"`,
        input,
        target[0],
      ),
    );
  }

  return {
    selectors: buildSelectors(tree, targetPath, target, input),
    path: targetPath,
  };
}

function buildSelectors(
  tree: PageObjectTree,
  targetPath: ResolvedTarget[],
  target: Token[],
  input: string,
) {
  const selectors: string[] = [];
  let currentNode: PageObjectTree | Selector = tree;

  targetPath.forEach((pathSegment) => {
    if (
      !currentNode ||
      typeof currentNode === 'string' ||
      typeof currentNode === 'function'
    ) {
      throw new Error('Invalid tree');
    }

    const child = currentNode[pathSegment.key];

    if (!child || typeof child === 'function') {
      throw new Error('Invalid tree');
    }

    currentNode = child;

    if (!currentNode) {
      throw new Error(
        prettyPrintError(
          `Could not resolve node for "${target
            .map((t) => t.value)
            .join(' ')}"`,
          input,
          target[0],
        ),
      );
    }

    let selector: Selector | undefined;

    if (typeof currentNode === 'object') {
      selector = currentNode._selector;
    } else {
      selector = currentNode;
    }

    if (typeof selector === 'string') {
      selectors.push(selector);
    } else if (typeof selector === 'function') {
      const arg = pathSegment.arg;

      if (arg) {
        selectors.push(selector(unquoted(arg)));
      } else {
        selectors.push(selector());
      }
    }
  });

  return selectors;
}

function resolveAssertion(
  target: ResolvedTarget[] | undefined,
  tree: PageObjectTree,
  assertion: string,
  input: string,
  firstToken: Token,
): ResolvedAssertion {
  const builtinAssertion = findBuiltinAssertion(assertion);

  if (builtinAssertion) {
    return {
      kind: 'builtin',
      chainer: builtinAssertion,
    };
  }

  if (target) {
    const customAssertion = findCustomAssertion(assertion, target, tree);

    if (customAssertion) {
      return {
        kind: 'custom',
        method: customAssertion,
      };
    }
  }

  throw new Error(
    prettyPrintError(`Unknown assertion "${assertion}"`, input, firstToken),
  );
}

function findBuiltinAssertion(assertion: string): string | null {
  const isNegated = assertion.startsWith('not ');

  if (isNegated) {
    assertion = assertion.slice(4);
  }

  const isKnown = Object.keys(KnownChainer).includes(assertion);

  if (isKnown) {
    const resolved = KnownChainer[assertion as keyof typeof KnownChainer];
    return isNegated ? 'not.' + resolved : resolved;
  }

  return null;
}

function findCustomAssertion(
  assertion: string,
  target: ResolvedTarget[] | null,
  tree: PageObjectTree,
): string | null {
  if (!target) {
    return null;
  }

  const node = getNode(
    tree,
    target.map((t) => t.key),
  );
  const assertionTestValue = assertion.split(' ').join('').toLowerCase();

  for (const key in node) {
    const keyWithoutShould = key
      .toLowerCase()
      .split('_')
      .join('')
      .replace('should', '');
    const candidate = node[key];

    if (
      keyWithoutShould === assertionTestValue &&
      typeof candidate === 'function'
    ) {
      return key;
    }
  }

  return null;
}

function extractSystemLevelInstruction(
    context: Context,
    statement: SystemLevelStatement,
    input: string,
): SystemLevelInstruction {
  const actionName = statement.tokens
      .map((a) => a.value)
      .map((a) => a.toLowerCase())
      .join('');

  for (let systemActionsKey in context.systemActions) {
    if (systemActionsKey.toLowerCase() == actionName) {
      const args = statement.args
          .map((arg) => unquoted(arg.value));
      return {
        kind: 'system-level',
        key: systemActionsKey,
        args,
      };
    }
  }

  const prettyActionName = statement.tokens
      .map((a) => a.value)
      .join(' ');

  throw new Error(
      prettyPrintError(
          `Unknown system-level action "${prettyActionName}"`,
          input,
          statement.tokens[0],
      ),
  );
}