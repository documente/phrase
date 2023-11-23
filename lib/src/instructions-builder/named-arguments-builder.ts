import { isNamedArgument, withoutMoustaches } from './named-arguments';

export function extractNamedArguments(
  fragments: string[],
  args: string[],
): Record<string, string> {
  return fragments
    .filter((v) => isNamedArgument(v))
    .map((v) => withoutMoustaches(v))
    .reduce(
      (acc, curr, index) => {
        acc[curr] = args[index];
        return acc;
      },
      {} as Record<string, string>,
    );
}
