import { getNode } from './get-node';
import { PageObjectTree } from './page-object-tree';
import { isQuoted } from './quoted-text';

export interface ResolvedTarget {
  fragments: string[];
  key: string;
  arg?: string;
}

export function resolve(
  tree: PageObjectTree,
  pathSegments: string[],
  previous: ResolvedTarget[],
): ResolvedTarget[] | undefined {
  if (previous?.length > 0) {
    const previousNode = getNode(
      tree,
      previous.map((p) => p.key),
    );

    if (previousNode) {
      const match = resolvePathRecursively(previousNode, pathSegments);

      if (match) {
        return [...previous, ...match];
      }
    }
  }

  if (previous?.length > 1) {
    const pathToParent = previous.slice(0, -1);
    const parentNode = getNode(
      tree,
      pathToParent.map((p) => p.key),
    );

    if (parentNode) {
      const match = resolvePathRecursively(parentNode, pathSegments);

      if (match) {
        return [...pathToParent, ...match];
      }
    }
  }

  return resolvePathRecursively(tree, pathSegments);
}

export function resolvePath(
  tree: PageObjectTree,
  pathSegments: string[],
): ResolvedTarget | undefined {
  const keys = Object.keys(tree);

  for (let j = pathSegments.length; j > 0; j--) {
    const assembledToken = pathSegments.slice(0, j).join('');
    const matchingKey = keys.find((key) =>
      key.toLowerCase().startsWith(assembledToken.toLowerCase()),
    );

    if (matchingKey) {
      return { key: matchingKey, fragments: pathSegments.slice(0, j) };
    }
  }

  return undefined;
}

export function resolvePathRecursively(
  node: PageObjectTree,
  pathSegments: string[],
  resolvedSoFar: ResolvedTarget[] = [],
): ResolvedTarget[] | undefined {
  const groups = splitOnQuotedText(pathSegments);
  const group = groups[0];

  const match = resolvePath(node, group.segments);

  if (!match) {
    return undefined;
  }

  const matchWithArg = { ...match, arg: group.arg };
  const segmentsWithoutArgs = pathSegments.filter(
    (segment) => !isQuoted(segment),
  );

  if (segmentsWithoutArgs.length === match.fragments.length) {
    return [...resolvedSoFar, matchWithArg];
  }

  return resolvePathRecursively(
    node[match.key] as PageObjectTree,
    pathSegments.slice(match.fragments.length),
    [...resolvedSoFar, matchWithArg],
  );
}

interface PathSegmentGroup {
  segments: string[];
  arg?: string;
}

export function splitOnQuotedText(pathSegments: string[]): PathSegmentGroup[] {
  const groups: PathSegmentGroup[] = [];
  let currentSegments: string[] = [];

  pathSegments.forEach((segment) => {
    if (isQuoted(segment)) {
      groups.push({
        segments: currentSegments,
        arg: segment,
      });
      currentSegments = [];
    } else {
      currentSegments.push(segment);
    }
  });

  if (currentSegments.length > 0) {
    groups.push({
      segments: currentSegments,
    });
  }

  return groups;
}
