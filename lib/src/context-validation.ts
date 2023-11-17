import {PageObjectTree} from './page-object-tree';
import {Context} from './context.interface';

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

function validatePageObjectNode(node: PageObjectTree | string | Function | undefined, path: string[]) {
  if (!node) {
    throw new Error('Page object node must not be null or undefined at path ' + path.join('.'));
  }

  if (typeof node === 'function' || typeof node === 'string') {
    return;
  }

  if (typeof node !== 'object') {
    throw new Error('Page object node must be either a string, function or an object at path ' + path.join('.'));
  }

  if (node._selector && typeof node._selector !== 'string' && typeof node._selector !== 'function') {
    throw new Error('Page object node selector must be either a string or a function at path ' + path.join('.') + '._selector');
  }

  for (const key in node) {
    validatePageObjectNode(node[key], [...path, key]);
  }
}
