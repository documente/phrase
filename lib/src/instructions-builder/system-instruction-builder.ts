import { SystemLevelStatement } from '../interfaces/statements.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import { SystemLevelInstruction } from '../interfaces/instructions.interface';
import { unquoted } from '../quoted-text';
import { prettyPrintError } from '../error';
import { decamelize } from '../decamelize';

export function extractSystemLevelInstruction(
  statement: SystemLevelStatement,
  context: BuildContext,
): SystemLevelInstruction {
  const actionName = statement.tokens
    .map((a) => a.value)
    .map((a) => a.toLowerCase())
    .join(' ');

  for (const key in context.externals) {
    const decamelized = decamelize(key);
    if (decamelized.toLowerCase() == actionName) {
      const args = statement.args.map((arg) => unquoted(arg.value));
      return {
        kind: 'system-level',
        key,
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
