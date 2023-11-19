export function isNamedArgument(str: string): boolean {
  return str.startsWith('{{') && str.endsWith('}}');
}

export function withoutMoustaches(str: string): string {
  if (isNamedArgument(str)) {
    return str.slice(2, -2);
  }

  return str;
}

export function interpolate(str: string, args: Record<string, string>): string {
  return str.replace(/{{(.*?)}}/g, (_, arg) => {
    if (args[arg]) {
      return args[arg];
    }

    return `{{${arg}}}`;
  });
}
