export enum BuiltinAction {
  click = 'click',
  type = 'type',
  visit = 'visit',
}

export function isBuiltinAction(action: string): action is BuiltinAction {
  return Object.values(BuiltinAction).includes(action as BuiltinAction);
}
