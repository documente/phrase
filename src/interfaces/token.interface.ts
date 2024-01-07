export interface BaseToken {
  kind: string;
  value: string;
  line: number;
  column: number;
  index: number;
}

export interface GenericToken extends BaseToken {
  kind: 'generic';
}

export interface BulletToken extends BaseToken {
  kind: 'bullet';
}

export interface ColonToken extends BaseToken {
  kind: 'colon';
}

export type Token = GenericToken | BulletToken | ColonToken;
