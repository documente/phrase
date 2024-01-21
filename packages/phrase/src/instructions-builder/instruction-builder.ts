import { Instruction } from '../interfaces/instructions.interface';
import { Parser } from '../parser';
import {
  Block,
  GivenWhenThenStatements,
  Statement,
} from '../interfaces/statements.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import { extractInstructionsFromStatement } from './generic-instruction-extractor';
import { SelectorTree } from '../interfaces/selector-tree.interface';
import { Externals } from '../interfaces/externals.interface';

export function buildInstructions(
  input: string,
  selectorTree: SelectorTree,
  externals: Externals,
  envVars: Record<string, string>,
): Instruction[] {
  const parser = new Parser();
  const sections = parser.parse(input);
  const blocks = sections.filter(
    (section) => section.kind !== 'given-when-then',
  ) as Block[];

  const buildContext: BuildContext = {
    previousPath: [],
    selectorTree,
    externals,
    blocks,
    input,
    envVars,
  };

  return sections
    .filter((section) => section.kind === 'given-when-then')
    .map((section) => {
      const givenWhenThen = section as GivenWhenThenStatements;
      return [
        ...buildInstructionsFromStatements(givenWhenThen.given, buildContext),
        ...buildInstructionsFromStatements(givenWhenThen.when, buildContext),
        ...buildInstructionsFromStatements(givenWhenThen.then, buildContext),
      ];
    })
    .flat();
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
