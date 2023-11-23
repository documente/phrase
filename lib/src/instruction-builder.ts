import { resolve } from './resolver';
import { prettyPrintError } from './error';
import { unquoted } from './quoted-text';
import { KnownChainer } from './known-chainers';
import { getNode } from './get-node';
import { Context } from './interfaces/context.interface';
import {
  ActionInstruction,
  AssertionInstruction,
  BlockActionInstruction,
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
import {
  interpolate,
  isNamedArgument,
  withoutMoustaches,
} from './named-arguments';
import {
  asQualifiedPart,
  BuiltinActionQualifiedPatterns,
  getMatchResult,
  MatchResult,
  QualifiedPatternPart,
} from './builtin-actions';

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
      {},
    );
    instructions.push(...extractedInstructions);
  });

  return instructions;
}

function extractInstructionsFromStatement(
  statement: Statement,
  buildContext: BuildContext,
  blockStack: Block[],
  namedArguments: Record<string, string>,
): Instruction[] {
  const kind = statement.kind;

  if (kind === 'system-level') {
    return [extractSystemLevelInstruction(statement, buildContext)];
  } else if (kind === 'action') {
    const actionInstruction = extractActionInstruction(
      statement,
      buildContext,
      namedArguments,
    );

    if (actionInstruction.kind === 'block-action') {
      return extractInstructionsFromBlock(
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
      return extractInstructionsFromBlock(
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

function extractNamedArguments(
  fragments: string[],
  args: string[],
): Record<string, string> {
  return fragments
    .filter((v) => isNamedArgument(v))
    .map((v) => withoutMoustaches(v))
    .reduce(
      (acc, curr, index) => {
        acc[curr] = args[index];
        return acc;
      },
      {} as Record<string, string>,
    );
}

function extractActionInstruction(
  actionStatement: ActionStatement,
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
): ActionInstruction {
  const block = findActionBlock(
    actionStatement.tokens,
    buildContext.blocks,
    buildContext,
    namedArguments,
  );

  if (block) {
    return block;
  }

  for (const parts of BuiltinActionQualifiedPatterns.keys()) {
    const matchResult = getMatchResult(actionStatement.tokens, parts);

    if (matchResult) {
      const { interpolatedArgs, selectors } = buildArgsAndSelectors(
        matchResult,
        buildContext,
        namedArguments,
      );

      return {
        kind: 'builtin-action',
        selectors,
        action: BuiltinActionQualifiedPatterns.get(parts)!,
        args: interpolatedArgs,
      };
    }
  }

  throw new Error(
    prettyPrintError(
      `Unknown action "${actionStatement.tokens
        .map((a) => a.value)
        .join(' ')}"`,
      buildContext.input,
      actionStatement.tokens[0],
    ),
  );
}

interface ArgsAndSelectors {
  interpolatedArgs: string[];
  selectors: string[] | null;
}

function buildArgsAndSelectors(
  matchResult: MatchResult,
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
): ArgsAndSelectors {
  const { target, args } = matchResult;

  const resolved = extractTargetSelector(target, buildContext);
  const selectors = resolved?.selectors ?? null;

  const interpolatedArgs = args.map((arg) =>
    interpolate(unquoted(arg.value), namedArguments, arg, buildContext.input),
  );

  return { interpolatedArgs, selectors };
}

function findActionBlock(
  tokens: Token[],
  blocks: Block[],
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
): BlockActionInstruction | null {
  for (const block of blocks) {
    if (block.kind === 'action-block') {
      const headerQualifiedParts: QualifiedPatternPart[] = block.header.map(
        (token) => asQualifiedPart(token.value),
      );

      const matchResult = getMatchResult(tokens, headerQualifiedParts);

      if (matchResult) {
        const { interpolatedArgs, selectors } = buildArgsAndSelectors(
          matchResult,
          buildContext,
          namedArguments,
        );

        return {
          kind: 'block-action',
          selectors,
          block,
          args: interpolatedArgs,
          namedArguments: extractNamedArguments(
            block.header.map((token) => token.value),
            interpolatedArgs,
          ),
          location: tokens[0],
          action: block.header.map((token) => token.value).join(' '), // TODO check
        };
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
        .filter((a) => !a.value.startsWith('$'))
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

  buildContext.previousPath = targetPath;

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
          `Could not resolve node for "${target.join(' ')}"`,
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

    const unquotedArgs = pathSegment.arg ? [unquoted(pathSegment.arg)] : [];

    const namedArguments = extractNamedArguments(
      pathSegment.key.split(' '),
      unquotedArgs,
    );

    if (typeof selector === 'string') {
      const interpolatedSelector = interpolate(
        selector,
        namedArguments,
        target[0],
        input,
      );
      selectors.push(interpolatedSelector);
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

  for (const systemActionsKey in context.testContext.systemActions) {
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
      namedArguments: extractNamedArguments(
        assertionBlock.header.map((token) => token.value),
        args,
      ),
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

interface BlockHolder {
  block: Block;
  location: Token;
  namedArguments: Record<string, string>;
}

function extractInstructionsFromBlock(
  blockHolder: BlockHolder,
  buildContext: BuildContext,
  blockStack: Block[],
): Instruction[] {
  const instructions: Instruction[] = [];
  const { block, location } = blockHolder;

  if (blockStack.includes(block)) {
    throw new Error(
      prettyPrintError(
        `Circular block detected: "${block.header
          .map((t) => t.value)
          .join(' ')}"`,
        buildContext.input,
        location,
      ),
    );
  }

  block.body.forEach((statement) => {
    instructions.push(
      ...extractInstructionsFromStatement(
        statement,
        buildContext,
        [...blockStack, block],
        blockHolder.namedArguments,
      ),
    );
  });

  return instructions;
}
