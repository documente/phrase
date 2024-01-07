import { isNamedArgument } from './named-arguments';
import { isArgument } from '../arguments';
import { Token } from '../interfaces/token.interface';

export const BuiltinActionCodes = [
  'visit',

  'click',
  'double_click',
  'right_click',

  'type',
  'clear',

  'check',
  'uncheck',

  'select',

  'scroll',

  'go_back',
  'go_forward',
] as const;

export type BuiltinActionCode = (typeof BuiltinActionCodes)[number];

export const BuiltinActionPatterns: Record<string, BuiltinActionCode> = {
  'visit {{url}}': 'visit',
  'click on $target': 'click',
  'click $target': 'click',
  'double click on $target': 'double_click',
  'double click $target': 'double_click',
  'double-click on $target': 'double_click',
  'double-click $target': 'double_click',
  'doubleclick on $target': 'double_click',
  'doubleclick $target': 'double_click',
  'right click on $target': 'right_click',
  'right click $target': 'right_click',
  'right-click on $target': 'right_click',
  'right-click $target': 'right_click',
  'rightclick on $target': 'right_click',
  'rightclick $target': 'right_click',
  'type {{text}} on $target': 'type',
  'type {{text}} into $target': 'type',
  'type {{text}} in $target': 'type',
  'clear $target': 'clear',
  'check $target': 'check',
  'uncheck $target': 'uncheck',
  'select {{item}} in $target': 'select',
  'select {{item}} from $target': 'select',
  'scroll to $target': 'scroll',
  'scroll $target into view': 'scroll',
  'go back': 'go_back',
  'go forward': 'go_forward',
};

export interface BuiltinActionArgPart {
  kind: 'arg';
}

export interface BuiltinActionTargetPart {
  kind: 'target';
}

export interface BuiltinActionTextPart {
  kind: 'text';
  value: string;
}

export type QualifiedPatternPart =
  | BuiltinActionArgPart
  | BuiltinActionTargetPart
  | BuiltinActionTextPart;

export function asQualifiedPart(part: string): QualifiedPatternPart {
  if (part.startsWith('$')) {
    return { kind: 'target' } as BuiltinActionTargetPart;
  } else if (isNamedArgument(part)) {
    return { kind: 'arg' } as BuiltinActionArgPart;
  } else {
    return { kind: 'text', value: part } as BuiltinActionTextPart;
  }
}

export const BuiltinActionQualifiedPatterns: Map<
  QualifiedPatternPart[],
  BuiltinActionCode
> = new Map(
  Object.entries(BuiltinActionPatterns).map(([pattern, code]) => [
    pattern.split(' ').map((part) => asQualifiedPart(part)),
    code as BuiltinActionCode,
  ]),
);

export interface MatchResult {
  target: Token[];
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
    }

    if (patternPart.kind === 'arg') {
      if (!isArgument(actionNameTokens[actionNameIndex].value)) {
        return null;
      }

      args.push(actionNameTokens[actionNameIndex]);
      actionNameIndex++;
    }

    // We assume that the target is the last part of the pattern
    if (patternPart.kind === 'target') {
      break;
    }
  }

  return { args, target: actionNameTokens.slice(actionNameIndex) };
}
