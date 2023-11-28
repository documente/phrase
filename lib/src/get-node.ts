import { SelectorTree } from './interfaces/selector-tree.interface';

export function getNode(
  tree: SelectorTree,
  pathSegments: string[],
): SelectorTree {
  return pathSegments.reduce((node: SelectorTree, pathSegment: string) => {
    return node[pathSegment] as SelectorTree;
  }, tree);
}
