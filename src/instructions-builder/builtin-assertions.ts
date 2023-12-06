import { isNamedArgument } from './named-arguments';
import { isArgument } from '../arguments';
import { Token } from '../interfaces/token.interface';

export const BuiltinAssertionCodes = [
  'have text',
  'be visible',
  'contain text',
  'have value',
  'have class',
  'exist',
  'not exist',
  'be checked',
  'be unchecked',
  'be disabled',
  'be enabled',
  'have occurrences',
] as const;

export type BuiltinAssertionCode = (typeof BuiltinAssertionCodes)[number];

export interface BuiltinAssertionArgPart {
  kind: 'arg';
}

export interface BuiltinAssertionTextPart {
  kind: 'text';
  value: string;
}

export const BuiltinAssertionPatterns: Record<string, BuiltinAssertionCode> = {
  'have text {{text}}': 'have text',
  'be visible': 'be visible',
  'contain text {{text}}': 'contain text',
  'have value {{value}}': 'have value',
  exist: 'exist',
  'not exist': 'not exist',
  'be checked': 'be checked',
  'be unchecked': 'be unchecked',
  'be disabled': 'be disabled',
  'be enabled': 'be enabled',
  'have {{count}} occurrences': 'have occurrences',
  'have {{count}} occurrence': 'have occurrences',
};

export type QualifiedPatternPart =
  | BuiltinAssertionArgPart
  | BuiltinAssertionTextPart;

export function asQualifiedPart(part: string): QualifiedPatternPart {
  if (isNamedArgument(part)) {
    return { kind: 'arg' } as BuiltinAssertionArgPart;
  } else {
    return { kind: 'text', value: part } as BuiltinAssertionTextPart;
  }
}

export const BuiltinAssertionQualifiedPatterns: Map<
  QualifiedPatternPart[],
  BuiltinAssertionCode
> = new Map(
  Object.entries(BuiltinAssertionPatterns).map(([pattern, code]) => [
    pattern.split(' ').map((part) => asQualifiedPart(part)),
    code as BuiltinAssertionCode,
  ]),
);

export interface MatchResult {
  args: Token[];
}

export function getMatchResult(
  actionNameTokens: Token[],
  pattern: QualifiedPatternPart[],
): MatchResult | null {
  let actionNameIndex = 0;

  const args: Token[] = [];

  for (const patternPart of pattern) {
    if (patternPart.kind === 'text') {
      const valueParts = patternPart.value.split(' ');

      for (const valuePart of valueParts) {
        if (actionNameTokens[actionNameIndex].value !== valuePart) {
          return null;
        }

        actionNameIndex++;
      }
    } else if (patternPart.kind === 'arg') {
      if (actionNameIndex >= actionNameTokens.length) {
        return null;
      }

      if (!isArgument(actionNameTokens[actionNameIndex].value)) {
        return null;
      }

      args.push(actionNameTokens[actionNameIndex]);
      actionNameIndex++;
    }
  }

  return { args };
}
