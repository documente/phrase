import { SelectorTree, Selector } from './interfaces/selector-tree.interface';
import { Externals } from './interfaces/externals.interface';
import { decamelize } from './decamelize';

export function validateContext(
  selectorTree: SelectorTree,
  externals?: Externals,
): void {
  if (!selectorTree) {
    throw new Error('Selector tree is required');
  }

  for (const key in externals) {
    const externalFn: unknown = externals[key];

    if (typeof externalFn !== 'function') {
      throw new Error(`externals.${key} must be a function`);
    }
  }

  const canonicalPaths: string[] = [];

  for (const key in selectorTree) {
    validateSelectorNode(selectorTree[key], [key], canonicalPaths);
  }

  reportAmbiguousPaths(canonicalPaths);
}

function validateSelectorNode(
  node: SelectorTree | Selector | undefined,
  path: string[],
  canonicalPaths: string[],
) {
  if (node == null) {
    throw new Error(
      'Selector tree node must not be null or undefined at path ' +
        path.join('.'),
    );
  }

  if (node === '') {
    throw new Error(
      'Selector tree node must not be empty string at path ' + path.join('.'),
    );
  }

  const canonicalPath = asCanonicalPath(path);
  canonicalPaths.push(canonicalPath);

  if (typeof node === 'function' || typeof node === 'string') {
    return;
  }

  if (typeof node !== 'object') {
    throw new Error(
      'Selector tree node must be either a string, function or an object at path ' +
        path.join('.'),
    );
  }

  if (
    node._selector &&
    typeof node._selector !== 'string' &&
    typeof node._selector !== 'function'
  ) {
    throw new Error(
      'Selector tree node selector must be either a string or a function at path ' +
        path.join('.') +
        '._selector',
    );
  }

  if (node._selector === '') {
    throw new Error(
      'Selector tree node selector must not be empty string at path ' +
        path.join('.') +
        '._selector',
    );
  }

  for (const key in node) {
    validateSelectorNode(node[key], [...path, key], canonicalPaths);
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
      'Ambiguous selector tree paths detected: ' +
        ambiguousPaths.map((path) => `"${path}"`).join(', ') +
        '. Please use unique selector tree paths.',
    );
  }
}
