type Assertions = {
  [name: string]: () => void;
};

type Children = {
  [name: string]: TreeNode;
};

type TreeNode = {
  _selector: string;
  _assertions: Assertions;
  _children: Children;
};

type Proxified<T extends TreeNode> =
    T extends { _children: infer C }
        ? { [K in keyof C]: Proxified<C[K] & TreeNode>; } & T['_assertions']
        : T['_assertions'];

const tree = {
  _selector: 'button',
  _assertions: {
    shouldBeClickable() {},
  },
  _children: {
    child1: {
      _selector: '.child1',
      _assertions: {
        shouldBeVisible() {},
      },
      _children: {
        grandchild: {
          _selector: '.grandchild',
          _children: {},
          _assertions: {},
        },
      },
    },
    child2: {
      _selector: '.child2',
      _children: {},
      _assertions: {},
    },
  },
} satisfies TreeNode;

const runtimeTree: Proxified<typeof tree> = {} as Proxified<typeof tree>;

runtimeTree.shouldBeClickable(); // No TypeScript error
runtimeTree.child1.shouldBeVisible(); // No TypeScript error
runtimeTree.child1.grandchild.foobar(); // No TypeScript error (but runtime error)
