import { PageObjectNode, PageObjectNodeDef } from './page-objects';
import { Party } from './party';

export interface SentenceContext {
  pageObjects: { [name: string]: PageObjectNode };
  parties: { [name: string]: Party };
}

export interface SentenceContextDef {
  pageObjects: { [name: string]: PageObjectNodeDef };
  parties: { [name: string]: Party };
}

export function resolveNode(
  path: string[],
  sentenceContext: SentenceContext,
): PageObjectNode {
  let node = null;

  for (const name of path) {
    if (node == null) {
      node = sentenceContext.pageObjects[name];
    } else {
      node = node.children[name];
    }
  }

  return node;
}
