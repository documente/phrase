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
    throw new Error(
      `Could not resolve path '${pathSegments.join(
        ' ',
      )}' from '${pathSoFar.join(' ')}'`,
    );
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
