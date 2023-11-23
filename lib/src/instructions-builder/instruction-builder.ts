import { prettyPrintError } from '../error';
import { unquoted } from '../quoted-text';
import { Context } from '../interfaces/context.interface';
import {
  Instruction,
  Instructions,
  SystemLevelInstruction,
} from '../interfaces/instructions.interface';
import { Parser } from '../parser';
import {
  Block,
  ParsedSentence,
  Statement,
  SystemLevelStatement,
} from '../interfaces/statements.interface';
import { Token } from '../interfaces/token.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import { extractActionInstruction } from './action-instruction-builder';
import { extractAssertionInstruction } from './assertion-instruction-builder';

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
