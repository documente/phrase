import { Block, Statement } from '../interfaces/statements.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import { Instruction } from '../interfaces/instructions.interface';
import { extractSystemLevelInstruction } from './system-instruction-builder';
import { extractActionInstruction } from './action-instruction-builder';
import { extractAssertionInstruction } from './assertion-instruction-builder';
import { extractInstructionsFromBlock } from './block-instructions-extractor';

export function extractInstructionsFromStatement(
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
      namedArguments,
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
