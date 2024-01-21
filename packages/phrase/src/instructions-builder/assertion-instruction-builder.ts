import { AssertionStatement, Block } from '../interfaces/statements.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import {
  AssertionInstruction,
  BlockAssertionInstruction,
  BuiltInAssertion,
} from '../interfaces/instructions.interface';
import { extractTargetSelector } from './target-selector-builder';
import { unquoted } from '../quoted-text';
import { prettyPrintError } from '../error';
import { interpolate, isNamedArgument } from './named-arguments';
import { extractNamedArguments } from './named-arguments-builder';
import {
  BuiltinAssertionCode,
  BuiltinAssertionQualifiedPatterns,
  getMatchResult,
} from './builtin-assertions';
import { TargetSelector } from '../interfaces/target-selector.interface';
import { isArgument } from '../arguments';

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

  const builtinAssertion = findBuiltinAssertion(
    statement,
    buildContext,
    namedArguments,
    resolved,
  );

  if (builtinAssertion) {
    return builtinAssertion;
  }

  const assertionName = statement.assertion.map((a) => a.value).join(' ');

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
  const assertionName = statement.assertion
    .filter((a) => !isArgument(a.value))
    .map((a) => a.value)
    .join(' ');

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

        const args = statement.assertion.filter((a) => isArgument(a.value));

        const interpolatedArgs = args.map((arg) =>
          interpolate(unquoted(arg.value), namedArguments, arg, buildContext),
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

function findBuiltinAssertion(
  assertion: AssertionStatement,
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
  targetSelector: TargetSelector | null,
): BuiltInAssertion | null {
  for (const parts of BuiltinAssertionQualifiedPatterns.keys()) {
    const matchResult = getMatchResult(assertion.assertion, parts);

    if (matchResult) {
      const interpolatedArgs = matchResult.args.map((arg) =>
        interpolate(unquoted(arg.value), namedArguments, arg, buildContext),
      );

      return {
        kind: 'builtin-assertion',
        args: interpolatedArgs,
        code: BuiltinAssertionQualifiedPatterns.get(
          parts,
        ) as BuiltinAssertionCode,
        selectors: targetSelector?.selectors ?? null,
        target: targetSelector?.path ?? null,
      };
    }
  }

  return null;
}
