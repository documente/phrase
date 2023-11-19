export enum BuiltinAction {
  click,
  type,
  visit,
  check,
  clear,
  'double click',
  'double-click',
  doubleclick,
  'right click',
  'right-click',
  rightclick,
  scroll,
  uncheck,
  select,
  'go back',
  'go forward',
}

export function isBuiltinAction(action: string): boolean {
  return Object.keys(BuiltinAction).includes(action);
}
