import {
  PageObjectTree,
  SelectorFn,
} from './interfaces/page-object-tree.interface';
import { Context, Externals } from './interfaces/context.interface';
import { decamelize } from './decamelize';
import { extractFunctionName } from './function-name';

export function validateContext(context: Context, externals: Externals): void {
  if (!context.pageObjectTree) {
    throw new Error('pageObjectTree is required');
  }
  if (!context.systemActions) {
    throw new Error('systemActions is required');
  }

  for (const key in context.systemActions) {
    const systemAction: unknown = context.systemActions[key];
    if (
      typeof systemAction !== 'function' &&
      typeof systemAction !== 'string'
    ) {
      throw new Error(`systemActions.${key} must be a function or a string`);
    }

    if (typeof systemAction === 'string') {
      const functionName = extractFunctionName(systemAction);
      const systemFunction = externals[functionName];
      if (typeof systemFunction !== 'function') {
        throw new Error(`externals['${functionName}'] must be a function.`);
      }
    }
  }

  const canonicalPaths: string[] = [];

  for (const key in context.pageObjectTree) {
    validatePageObjectNode(context.pageObjectTree[key], [key], canonicalPaths);
  }

  reportAmbiguousPaths(canonicalPaths);
}

function validatePageObjectNode(
  node: PageObjectTree | string | SelectorFn | VoidFunction | undefined,
  path: string[],
  canonicalPaths: string[],
) {
  if (node == null) {
    throw new Error(
      'Page object node must not be null or undefined at path ' +
        path.join('.'),
    );
  }

  if (node === '') {
    throw new Error(
      'Page object node must not be empty string at path ' + path.join('.'),
    );
  }

  const canonicalPath = asCanonicalPath(path);
  canonicalPaths.push(canonicalPath);

  if (typeof node === 'function' || typeof node === 'string') {
    return;
  }

  if (typeof node !== 'object') {
    throw new Error(
      'Page object node must be either a string, function or an object at path ' +
        path.join('.'),
    );
  }

  if (
    node._selector &&
    typeof node._selector !== 'string' &&
    typeof node._selector !== 'function'
  ) {
    throw new Error(
      'Page object node selector must be either a string or a function at path ' +
        path.join('.') +
        '._selector',
    );
  }

  if (node._selector === '') {
    throw new Error(
      'Page object node selector must not be empty string at path ' +
        path.join('.') +
        '._selector',
    );
  }

  for (const key in node) {
    validatePageObjectNode(node[key], [...path, key], canonicalPaths);
  }
}

function asCanonicalPath(path: string[]): string {
  return path
    .join(' ')
    .split(' ')
    .filter((s) => s !== '')
    .map((s) => decamelize(s))
    .map((s) => s.toLowerCase())
    .join(' ');
}

function reportAmbiguousPaths(canonicalPaths: string[]): void {
  const pathCounts: { [key: string]: number } = {};

  for (const path of canonicalPaths) {
    if (pathCounts[path] == null) {
      pathCounts[path] = 0;
    }
    pathCounts[path]++;
  }

  const ambiguousPaths = Object.keys(pathCounts).filter(
    (path) => pathCounts[path] > 1,
  );

  if (ambiguousPaths.length > 0) {
    throw new Error(
      'Ambiguous page object paths detected: ' +
        ambiguousPaths.map((path) => `"${path}"`).join(', ') +
        '. Please use unique page object paths.',
    );
  }
}
