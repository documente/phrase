import { getNode } from './get-node.js';

export function resolve(tree, pathSegments, previousPath) {
  if (previousPath?.length > 0) {
    const previousNode = getNode(tree, previousPath);

    if (previousNode) {
      const match = resolvePathRecursively(previousNode, pathSegments);

      if (match) {
        return [...previousPath, ...match];
      }
    }
  }

  if (previousPath?.length > 1) {
    const pathToParent = previousPath.slice(0, -1);
    const parentNode = getNode(tree, pathToParent);

    if (parentNode) {
      const match = resolvePathRecursively(parentNode, pathSegments);

      if (match) {
        return [...pathToParent, ...match];
      }
    }
  }

  return resolvePathRecursively(tree, pathSegments);
}

export function resolvePath(tree, pathSegments) {
  const keys = Object.keys(tree);

  for (let j = pathSegments.length; j > 0; j--) {
    const assembledToken = pathSegments.slice(0, j).join('');
    const matchingKey = keys.find((key) =>
      key.toLowerCase().startsWith(assembledToken.toLowerCase()),
    );

    if (matchingKey) {
      return { matchingKey, consumedLength: j };
    }
  }

  return undefined;
}

export function resolvePathRecursively(node, pathSegments, pathSoFar = []) {
  const match = resolvePath(node, pathSegments);

  if (!match) {
    return undefined;
  }

  const { matchingKey, consumedLength } = match;

  if (pathSegments.length === consumedLength) {
    return [...pathSoFar, matchingKey];
  }

  return resolvePathRecursively(
    node[matchingKey],
    pathSegments.slice(consumedLength),
    [...(pathSoFar || []), matchingKey],
  );
}
