import { resolve } from './resolver';
import { prettyPrintError } from './error';
import { isBuiltinAction } from './builtin-actions';
import { unquoted } from './quoted-text';
import { KnownChainer } from './known-chainers';
import { getNode } from './get-node';
import { Context } from './interfaces/context.interface';
import {
  ActionInstruction,
  AssertionInstruction,
  BlockActionInstruction,
  BlockAssertion,
  Instruction,
  Instructions,
  ResolvedTarget,
  SystemLevelInstruction,
} from './interfaces/instructions.interface';
import { Parser } from './parser';
import {
  ActionStatement,
  AssertionStatement,
  Block,
  ParsedSentence,
  Statement,
  SystemLevelStatement,
} from './interfaces/statements.interface';
import {
  PageObjectTree,
  Selector,
} from './interfaces/page-object-tree.interface';
import { Token } from './interfaces/token.interface';

interface BuildContext {
  previousPath: ResolvedTarget[];
  testContext: Context;
  blocks: Block[];
  input: string;
}

export function buildInstructions(
  input: string,
  context: Context,
): Instructions {
  const parser = new Parser();
  const parsedSentence: ParsedSentence = parser.parse(input);

  const buildContext: BuildContext = {
    previousPath: [],
    testContext: context,
    blocks: parsedSentence.blocks,
    input,
  };

  return {
    given: buildInstructionsFromStatements(parsedSentence.given, buildContext),
    when: buildInstructionsFromStatements(parsedSentence.when, buildContext),
    then: buildInstructionsFromStatements(parsedSentence.then, buildContext),
  };
}

function buildInstructionsFromStatements(
  statements: Statement[],
  buildContext: BuildContext,
  blockStack: Block[] = [],
): Instruction[] {
  const instructions: Instruction[] = [];

  statements.forEach((statement) => {
    const extractedInstructions = extractInstructionsFromStatement(
      statement,
      buildContext,
      blockStack,
    );
    instructions.push(...extractedInstructions);
  });

  return instructions;
}

function extractInstructionsFromStatement(
  statement: Statement,
  buildContext: BuildContext,
  blockStack: Block[],
): Instruction[] {
  const kind = statement.kind;

  if (kind === 'system-level') {
    return [extractSystemLevelInstruction(statement, buildContext)];
  } else if (kind === 'action') {
    const actionInstruction = extractActionInstruction(statement, buildContext);

    if (actionInstruction.kind === 'block-action') {
      return extractInstructionsFromActionBlock(
        actionInstruction,
        buildContext,
        blockStack,
      );
    } else {
      return [actionInstruction];
    }
  } else if (kind === 'assertion') {
    const assertionInstruction = extractAssertionInstruction(
      statement,
      buildContext,
    );

    if (assertionInstruction.kind === 'block-assertion') {
      return extractInstructionsFromAssertionBlock(
        assertionInstruction,
        buildContext,
        blockStack,
      );
    } else {
      return [assertionInstruction];
    }
  } else {
    throw new Error(`Unknown statement kind "${kind}"`);
  }
}

function extractActionInstruction(
  actionStatement: ActionStatement,
  buildContext: BuildContext,
): ActionInstruction {
  const resolved = extractTargetSelector(actionStatement.target, buildContext);
  const args = actionStatement.args.map((arg) => unquoted(arg.value));

  const selectors = resolved?.selectors ?? null;
  if (resolved?.path) {
    buildContext.previousPath = resolved.path;
  }

  const actionName = actionStatement.action.map((a) => a.value).join(' ');

  const block = findActionBlock(actionName, buildContext.blocks);

  if (block) {
    return {
      kind: 'block-action',
      selectors,
      action: actionName,
      args,
      block,
      location: actionStatement.action[0],
    };
  }

  if (isBuiltinAction(actionName)) {
    return {
      kind: 'builtin-action',
      selectors,
      action: actionName,
      args,
    };
  }

  throw new Error(
    prettyPrintError(
      `Unknown action "${actionName}"`,
      buildContext.input,
      actionStatement.action[0],
    ),
  );
}

function findActionBlock(actionName: string, blocks: Block[]): Block | null {
  for (const block of blocks) {
    if (block.kind === 'action-block') {
      const blockActionName = block.header
        .map((a) => a.value)
        .join(' ')
        .toLowerCase()
        .split(' on ')[0]
        .trim();

      if (blockActionName === actionName) {
        return block;
      }
    }
  }

  return null;
}

function findAssertionBlock(
  assertionName: string,
  blocks: Block[],
): Block | null {
  for (const block of blocks) {
    if (block.kind === 'assertion-block') {
      const blockActionName = block.header
        .map((a) => a.value)
        .join(' ')
        .toLowerCase()
        .split(' on ')[0]
        .trim();

      if (blockActionName === assertionName) {
        return block;
      }
    }
  }

  return null;
}

interface TargetSelector {
  selectors: string[];
  path: ResolvedTarget[];
}

function extractTargetSelector(
  target: Token[],
  buildContext: BuildContext,
): TargetSelector | null {
  if (target.length === 0) {
    return null;
  }

  const { testContext, previousPath, input } = buildContext;
  const tree = testContext.pageObjectTree;

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

    if (currentNode == null) {
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
  statement: SystemLevelStatement,
  context: BuildContext,
): SystemLevelInstruction {
  const actionName = statement.tokens
    .map((a) => a.value)
    .map((a) => a.toLowerCase())
    .join('');

  for (let systemActionsKey in context.testContext.systemActions) {
    if (systemActionsKey.toLowerCase() == actionName) {
      const args = statement.args.map((arg) => unquoted(arg.value));
      return {
        kind: 'system-level',
        key: systemActionsKey,
        args,
      };
    }
  }

  const prettyActionName = statement.tokens.map((a) => a.value).join(' ');

  throw new Error(
    prettyPrintError(
      `Unknown system-level action "${prettyActionName}"`,
      context.input,
      statement.tokens[0],
    ),
  );
}

function extractAssertionInstruction(
  statement: AssertionStatement,
  buildContext: BuildContext,
): AssertionInstruction {
  const resolved = extractTargetSelector(statement.target, buildContext);

  if (resolved?.path) {
    buildContext.previousPath = resolved.path;
  }

  const selectors = resolved?.selectors ?? null;
  const assertionName = statement.assertion.map((a) => a.value).join(' ');
  const args = statement.args.map((arg) => unquoted(arg.value));

  const assertionBlock = findAssertionBlock(assertionName, buildContext.blocks);

  if (assertionBlock) {
    return {
      kind: 'block-assertion',
      selectors,
      target: resolved?.path ?? null,
      block: assertionBlock,
      location: statement.firstToken,
      args,
    };
  }

  const builtinAssertion = findBuiltinAssertion(assertionName);

  if (builtinAssertion) {
    return {
      kind: 'builtin-assertion',
      chainer: builtinAssertion,
      selectors,
      target: resolved?.path ?? null,
      args,
    };
  }

  if (statement.target) {
    const customAssertion = findCustomAssertion(
      assertionName,
      resolved?.path ?? null,
      buildContext.testContext.pageObjectTree,
    );

    if (customAssertion) {
      return {
        kind: 'custom-assertion',
        method: customAssertion,
        selectors,
        target: resolved?.path ?? null,
        args,
      };
    }
  }

  throw new Error(
    prettyPrintError(
      `Unknown assertion "${assertionName}"`,
      buildContext.input,
      statement.firstToken,
    ),
  );
}

function extractInstructionsFromActionBlock(
  actionInstruction: BlockActionInstruction,
  buildContext: BuildContext,
  blockStack: Block[],
): Instruction[] {
  const instructions: Instruction[] = [];

  if (blockStack.includes(actionInstruction.block)) {
    throw new Error(
      prettyPrintError(
        `Circular action block detected: "${actionInstruction.action}"`,
        buildContext.input,
        actionInstruction.location,
      ),
    );
  }

  actionInstruction.block.body.forEach((statement) => {
    instructions.push(
      ...extractInstructionsFromStatement(statement, buildContext, [
        ...blockStack,
        actionInstruction.block,
      ]),
    );
  });

  return instructions;
}

// TODO refactor with extractInstructionsFromActionBlock
function extractInstructionsFromAssertionBlock(
  blockAssertion: BlockAssertion,
  buildContext: BuildContext,
  blockStack: Block[],
): Instruction[] {
  const instructions: Instruction[] = [];

  if (blockStack.includes(blockAssertion.block)) {
    throw new Error(
      prettyPrintError(
        `Circular action block detected: "${blockAssertion.block.header
          .map((t) => t.value)
          .join(' ')}"`,
        buildContext.input,
        blockAssertion.location,
      ),
    );
  }

  blockAssertion.block.body.forEach((statement) => {
    instructions.push(
      ...extractInstructionsFromStatement(statement, buildContext, [
        ...blockStack,
        blockAssertion.block,
      ]),
    );
  });

  return instructions;
}
