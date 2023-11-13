import { isQuoted } from './quoted-text';
import { isNumber } from './numbers';

export function isArgument(value: string): boolean {
  return isQuoted(value) || isNumber(value);
}
