import { getNode } from '../get-node';
import { isQuoted } from '../quoted-text';
import { SelectorTree } from '../interfaces/selector-tree.interface';
import { ResolvedTarget } from '../interfaces/instructions.interface';
import { withNamedArgumentsRemoved } from './named-arguments';
import { decamelize } from '../decamelize';

export function resolve(
  tree: SelectorTree,
  pathSegments: string[],
  previous: ResolvedTarget[],
): ResolvedTarget[] | undefined {
  if (pathSegments[0] === 'its' && pathSegments.length === 1) {
    throw new Error(`Expected child path after "its" but got nothing.`);
  }

  if (pathSegments[0] === 'its' && previous.length === 0) {
    throw new Error('Cannot use "its" without a previous path.');
  }

  if (previous?.length > 0) {
    const previousNode = getNode(
      tree,
      previous.map((p) => p.key),
    );

    if (!previousNode) {
      throw new Error(
        `Could not find node at path ${previous
          .map((p) => p.fragments)
          .flat()
          .join(' ')}`,
      );
    }

    const pathSegmentsWithoutIts =
      pathSegments[0] === 'its' ? pathSegments.slice(1) : pathSegments;

    const match = resolvePathRecursively(previousNode, pathSegmentsWithoutIts);

    if (match) {
      return [...previous, ...match];
    }
  }

  if (pathSegments[0] === 'its') {
    const fullPath = [
      ...previous.map((p) => p.fragments).flat(),
      ...pathSegments.slice(1),
    ];
    throw new Error(`Cannot find child node at path ${fullPath.join(' ')}`);
  }

  if (previous?.length > 1 && pathSegments[0] !== 'its') {
    const pathToParent = previous.slice(0, -1);
    const parentNode = getNode(
      tree,
      pathToParent.map((p) => p.key),
    );

    const match = resolvePathRecursively(parentNode, pathSegments);

    if (match) {
      return [...pathToParent, ...match];
    }
  }

  return resolvePathRecursively(tree, pathSegments);
}

export function resolvePath(
  tree: SelectorTree,
  pathSegments: string[],
): ResolvedTarget | undefined {
  const keys = Object.keys(tree);

  for (let j = pathSegments.length; j > 0; j--) {
    const assembledToken = pathSegments.slice(0, j).join(' ');
    const matchingKey = keys.find((key) => {
      const keyWithoutNamedArguments = withNamedArgumentsRemoved(key);
      return (
        decamelize(keyWithoutNamedArguments).toLowerCase() ==
        assembledToken.toLowerCase()
      );
    });

    if (matchingKey) {
      return { key: matchingKey, fragments: pathSegments.slice(0, j) };
    }
  }

  return undefined;
}

export function resolvePathRecursively(
  node: SelectorTree,
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

  const matchLength = match.fragments.length + (group.arg ? 1 : 0);

  return resolvePathRecursively(
    node[match.key] as SelectorTree,
    pathSegments.slice(matchLength),
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
