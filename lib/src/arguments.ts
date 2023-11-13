import { isQuoted } from './quoted-text';
import { isParsableAsNumber } from './numbers';

export function isArgument(value: string): boolean {
  return isQuoted(value) || isParsableAsNumber(value);
}
