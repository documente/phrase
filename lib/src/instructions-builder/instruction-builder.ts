import { Context } from '../interfaces/context.interface';
import {
  Instruction,
  Instructions,
} from '../interfaces/instructions.interface';
import { Parser } from '../parser';
import {
  Block,
  ParsedSentence,
  Statement,
} from '../interfaces/statements.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import { extractInstructionsFromStatement } from './generic-instruction-extractor';

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
  return statements
    .map((statement) =>
      extractInstructionsFromStatement(statement, buildContext, blockStack, {}),
    )
    .flat();
}
