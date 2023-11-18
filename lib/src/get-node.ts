import { PageObjectTree } from './interfaces/page-object-tree.interface';

export function getNode(
  tree: PageObjectTree,
  pathSegments: string[],
): PageObjectTree {
  return pathSegments.reduce((node: PageObjectTree, pathSegment: string) => {
    return node[pathSegment] as PageObjectTree;
  }, tree);
}
