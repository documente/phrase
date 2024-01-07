import { CodeLocation, prettyPrintError } from '../error';
import { Token } from '../interfaces/token.interface';
import { BuildContext } from '../interfaces/build-context.interface';

export function isNamedArgument(str: string): boolean {
  return str.startsWith('{{') && str.endsWith('}}');
}

export function withoutMoustaches(str: string): string {
  if (isNamedArgument(str)) {
    return str.slice(2, -2);
  }

  return str;
}

export function withNamedArgumentsRemoved(str: string): string {
  return str.replace(/{{(.*?)}}/g, '');
}

export function interpolate(
  str: string,
  args: Record<string, string>,
  token: Token,
  buildContext: BuildContext,
): string {
  return str.replace(/{{(.*?)}}/g, (_, arg) => {
    if (args[arg]) {
      return args[arg];
    } else if (buildContext.envVars[arg]) {
      return buildContext.envVars[arg];
    }

    const location: CodeLocation = {
      line: token.line,
      column: token.column + token.value.indexOf(`{{${arg}}}`),
    };

    throw new Error(
      prettyPrintError(
        `Unknown argument "${arg}"`,
        buildContext.input,
        location,
      ),
    );
  });
}
