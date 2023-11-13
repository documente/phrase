import { Parser } from './parser.js';
import { resolve } from './resolver.js';
import { prettyPrintError } from './error.js';
import { isBuiltinAction } from './builtin-actions.js';
import { isQuoted, unquoted } from './quoted-text.js';

export function buildInstructions(input, tree) {
  const parser = new Parser();
  const sentenceTree = parser.parse(input);

  const actions = [];
  let previousPath = [];

  sentenceTree.prerequisite.forEach((action) => {
    previousPath = extractAction(tree, action, previousPath, input, actions);
  });

  sentenceTree.actions.forEach((action) => {
    previousPath = extractAction(tree, action, previousPath, input, actions);
  });

  const assertions = [];

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

function extractAction(tree, action, previousPath, input, actions) {
  const resolved = extractTargetSelector(
    tree,
    action.target,
    previousPath,
    input,
  );
  const target = resolved?.selectors ?? null;
  if (resolved?.path) {
    console.log('resolved path', resolved);
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

function extractActionInstruction(action, input) {
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

function extractTargetSelector(tree, target, previousPath, input) {
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

function buildSelectors(tree, targetPath, target, input) {
  const selectors = [];
  let currentNode = tree;

  targetPath.forEach((pathSegment) => {
    currentNode = currentNode[pathSegment];
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

    const selector = currentNode._selector ?? currentNode;

    if (typeof selector === 'string') {
      selectors.push(selector);
    } else {
      // TODO: handle multiple arguments in the same target path
      const arg = target.find((t) => isQuoted(t.value));
      selectors.push(selector(unquoted(arg?.value)));
    }
  });
  return selectors;
}
