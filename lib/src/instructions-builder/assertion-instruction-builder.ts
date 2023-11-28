import { AssertionStatement, Block } from '../interfaces/statements.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import {
  AssertionInstruction,
  BlockAssertionInstruction,
} from '../interfaces/instructions.interface';
import { extractTargetSelector } from './target-selector-builder';
import { unquoted } from '../quoted-text';
import { prettyPrintError } from '../error';
import { KnownChainer } from '../known-chainers';
import {
  interpolate,
  isNamedArgument,
  withNamedArgumentsRemoved,
} from './named-arguments';
import { extractNamedArguments } from './named-arguments-builder';

export function extractAssertionInstruction(
  statement: AssertionStatement,
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
): AssertionInstruction {
  const assertionBlock = findAssertionBlock(
    statement,
    buildContext.blocks,
    buildContext,
    namedArguments,
  );

  if (assertionBlock) {
    return assertionBlock;
  }

  const resolved = extractTargetSelector(
    statement.target,
    buildContext,
    namedArguments,
  );
  const selectors = resolved?.selectors ?? null;
  const assertionName = statement.assertion.map((a) => a.value).join(' ');
  const args = statement.args.map((arg) =>
    interpolate(unquoted(arg.value), namedArguments, arg, buildContext.input),
  );

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

  throw new Error(
    prettyPrintError(
      `Unknown assertion "${assertionName}"`,
      buildContext.input,
      statement.firstToken,
    ),
  );
}

function findAssertionBlock(
  statement: AssertionStatement,
  blocks: Block[],
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
): BlockAssertionInstruction | null {
  const assertionName = statement.assertion.map((a) => a.value).join(' ');

  for (const block of blocks) {
    if (block.kind === 'assertion-block') {
      const blockActionName = block.header
        .filter((a) => !a.value.startsWith('$'))
        .filter((a) => !isNamedArgument(a.value))
        .map((a) => a.value)
        .join(' ')
        .toLowerCase()
        .split(' on ')[0]
        .trim();

      if (blockActionName === assertionName) {
        const resolved = extractTargetSelector(
          statement.target,
          buildContext,
          namedArguments,
        );
        const selectors = resolved?.selectors ?? null;

        const interpolatedArgs = statement.args.map((arg) =>
          interpolate(
            unquoted(arg.value),
            namedArguments,
            arg,
            buildContext.input,
          ),
        );

        return {
          kind: 'block-assertion',
          block,
          args: interpolatedArgs,
          target: resolved?.path ?? null,
          selectors,
          namedArguments: extractNamedArguments(
            block.header.map((token) => token.value),
            interpolatedArgs,
          ),
          location: statement.firstToken,
        };
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
