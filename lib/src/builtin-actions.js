export const BuiltinAction = {
  click: 'click',
  type: 'type',
  visit: 'visit',
};

export function isBuiltinAction(action) {
  return Object.values(BuiltinAction).includes(action);
}
