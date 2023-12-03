import { Block } from '../interfaces/statements.interface';
import { Token } from '../interfaces/token.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import { Instruction } from '../interfaces/instructions.interface';
import { prettyPrintError } from '../error';
import { extractInstructionsFromStatement } from './generic-instruction-extractor';

interface BlockHolder {
  block: Block;
  location: Token;
  namedArguments: Record<string, string>;
}

export function extractInstructionsFromBlock(
  blockHolder: BlockHolder,
  buildContext: BuildContext,
  blockStack: Block[],
): Instruction[] {
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

  return block.body
    .map((statement) =>
      extractInstructionsFromStatement(
        statement,
        buildContext,
        [...blockStack, block],
        blockHolder.namedArguments,
      ),
    )
    .flat();
}
