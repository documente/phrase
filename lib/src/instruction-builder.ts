import { Action, Parser, Sentence } from './parser';
import { resolve } from './resolver';
import { prettyPrintError } from './error';
import { isBuiltinAction } from './builtin-actions';
import { isQuoted, unquoted } from './quoted-text';
import { PageObjectTree, Selector } from './page-object-tree';
import { Token } from './tokenizer';

export interface ActionInstruction {
  target: string[] | null;
  action: string;
  args: string[];
}

export interface AssertionInstruction {
  target: string[] | null;
  assertion: string;
  args: string[];
}

export interface Instructions {
  actions: ActionInstruction[];
  assertions: AssertionInstruction[];
}

export function buildInstructions(
  input: string,
  tree: PageObjectTree,
): Instructions {
  const parser = new Parser();
  const sentenceTree: Sentence = parser.parse(input);

  const actions: ActionInstruction[] = [];
  let previousPath: string[] = [];

  sentenceTree.prerequisites.forEach((action) => {
    previousPath = extractAction(tree, action, previousPath, input, actions);
  });

  sentenceTree.actions.forEach((action) => {
    previousPath = extractAction(tree, action, previousPath, input, actions);
  });

  const assertions: AssertionInstruction[] = [];

  sentenceTree.assertions.forEach((assertion) => {
    const resolved = extractTargetSelector(
      tree,
      assertion.target,
      previousPath,
      input,
    );
    const target = resolved?.selectors ?? null;
    if (resolved?.path) {
      previousPath = resolved.path;
    }

    const assertionName = assertion.assertion.map((a) => a.value).join(' ');
    const args = assertion.args.map((arg) => unquoted(arg.value));

    assertions.push({
      target,
      assertion: assertionName,
      args,
    });
  });

  return {
    actions,
    assertions,
  };
}

function extractAction(
  tree: PageObjectTree,
  action: Action,
  previousPath: string[],
  input: string,
  actions: ActionInstruction[],
): string[] {
  const resolved = extractTargetSelector(
    tree,
    action.target,
    previousPath,
    input,
  );
  const target = resolved?.selectors ?? null;
  if (resolved?.path) {
    previousPath = resolved.path;
  }
  const actionName = extractActionInstruction(action, input);
  const args = action.args.map((arg) => unquoted(arg.value));

  actions.push({
    target,
    action: actionName,
    args,
  });
  return previousPath;
}

function extractActionInstruction(action: Action, input: string) {
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
  previousPath: string[],
  input: string,
) {
  if (target.length === 0) {
    return null;
  }

  if (target.length === 1 && target[0].value === 'it') {
    const selectors = buildSelectors(tree, previousPath, target, input);

    return {
      selectors,
      path: previousPath,
    };
  }

  const targetFragments = target
    .map((t) => t.value)
    .filter((t) => !isQuoted(t));

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
  const selectors = buildSelectors(tree, targetPath, target, input);

  return {
    selectors,
    path: targetPath,
  };
}

function buildSelectors(
  tree: PageObjectTree,
  targetPath: string[],
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

    const child = currentNode[pathSegment];

    if (!child) {
      throw new Error('Invalid tree');
    }

    currentNode = child;

    if (!currentNode) {
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

    let selector: Selector | undefined;

    if (typeof currentNode === 'object') {
      selector = currentNode._selector;
    } else if (typeof currentNode === 'string' || typeof currentNode === 'function') {
      selector = currentNode;
    }

    if (typeof selector === 'string') {
      selectors.push(selector);
    } else if (typeof selector === 'function') {
      // TODO: handle multiple arguments in the same target path
      const arg = target.find((t) => isQuoted(t.value));

      if (arg) {
        selectors.push(selector(unquoted(arg.value)));
      } else {
        selectors.push(selector());
      }
    }
  });

  return selectors;
}
