import { isQuoted } from './quoted-text';
import { isParsableAsNumber } from './numbers';
import { isNamedArgument } from './instructions-builder/named-arguments';

export function isArgument(value: string): boolean {
  return isQuoted(value) || isParsableAsNumber(value) || isNamedArgument(value);
}
