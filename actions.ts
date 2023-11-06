export enum ActionKind {
  click,
  type,
  hover,
}

interface BaseAction {
  readonly kind: ActionKind;
}

export interface ClickAction extends BaseAction {
  readonly kind: ActionKind.click;
}

export function buildClickAction(): ClickAction {
  return {
    kind: ActionKind.click,
  };
}

export interface HoverAction extends BaseAction {
  readonly kind: ActionKind.hover;
}

export function buildHoverAction(): HoverAction {
  return {
    kind: ActionKind.hover,
  };
}

export interface TypeAction extends BaseAction {
  readonly kind: ActionKind.type;
}

export function buildTypeAction(): TypeAction {
  return {
    kind: ActionKind.type,
  };
}

export type Action = TypeAction
  | ClickAction
  | HoverAction
;
