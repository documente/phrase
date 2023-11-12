export const BuiltinAction = {
  click: 'click',
  type: 'type',
  hover: 'hover',
  press: 'press',
  release: 'release',
};

export function isBuiltinAction(action) {
  return Object.values(BuiltinAction).includes(action);
}
