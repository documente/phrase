type Children = {
  [name: string]: TreeNode;
};

type Assertions = {
  [name: string]: Function;
};

type TreeNode = {
  _selector: string;
  _children?: Children;
  _assertions?: Assertions;
};

type Proxified<T extends TreeNode> = T extends { _children: infer C; _assertions: infer A }
    ? {
      [K in keyof C]: Proxified<C[K] & TreeNode>; } & {
      [K in keyof A]: A[K];
    }
    : {};

const tree = {
  _selector: 'button',
  _children: {
    child1: {
      _selector: '.child1',
      _children: {
        grandchild: {
          _selector: '.grandchild',
        },
      },
    },
    child2: {
      _selector: '.child2',
    },
  },
} satisfies TreeNode;

const runtimeTree = {} as Proxified<typeof tree>;

runtimeTree.child1.grandchild;
runtimeTree.child2.foobar; // TS2339: Property  foobar  does not exist on type  {} 
runtimeTree.child1.grandchild.blabla(); // TS2339: Property  blabla  does not exist on type  {}