import { AssertionStatement, Block } from '../interfaces/statements.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import {
  AssertionInstruction,
  ResolvedTarget,
} from '../interfaces/instructions.interface';
import { extractTargetSelector } from './target-selector-builder';
import { unquoted } from '../quoted-text';
import { prettyPrintError } from '../error';
import { KnownChainer } from '../known-chainers';
import { PageObjectTree } from '../interfaces/page-object-tree.interface';
import { getNode } from '../get-node';
import { extractNamedArguments } from './named-arguments-builder';
import {isNamedArgument, withNamedArgumentsRemoved} from './named-arguments';

export function extractAssertionInstruction(
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

function findAssertionBlock(
  assertionName: string,
  blocks: Block[],
): Block | null {
  for (const block of blocks) {
    if (block.kind === 'assertion-block') {
      const blockActionName = block.header
        .filter((a) => !a.value.startsWith('$'))
        .filter((a) => ! isNamedArgument(a.value))
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

function findBuiltinAssertion(assertion: string): string | null {
  assertion = withNamedArgumentsRemoved(assertion).trim();
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
