import {
  PageObjectTree,
  SelectorFn,
} from './interfaces/page-object-tree.interface';
import { Context } from './interfaces/context.interface';

export function validateContext(context: Context): void {
  if (!context.pageObjectTree) {
    throw new Error('pageObjectTree is required');
  }
  if (!context.systemActions) {
    throw new Error('systemActions is required');
  }

  for (const key in context.systemActions) {
    if (typeof context.systemActions[key] !== 'function') {
      throw new Error(`systemActions.${key} must be a function`);
    }
  }

  for (const key in context.pageObjectTree) {
    validatePageObjectNode(context.pageObjectTree[key], [key]);
  }
}

function validatePageObjectNode(
  node: PageObjectTree | string | SelectorFn | VoidFunction | undefined,
  path: string[],
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
    validatePageObjectNode(node[key], [...path, key]);
  }
}
