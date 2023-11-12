export function getNode(tree, pathSegments) {
  return pathSegments.reduce((node, pathSegment) => {
    return node[pathSegment];
  }, tree);
}
