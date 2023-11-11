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

type CheckedProxified<T extends TreeNode> = Proxified<T> & {
  [key: string]: never; // Enforce noUncheckedIndexedAccess
};

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
          _assertions: {
            shouldBeRed() {},
          },
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

const runtimeTree: CheckedProxified<typeof tree> = {} as CheckedProxified<typeof tree>;

runtimeTree.shouldBeClickable(); // No TypeScript error
runtimeTree.child1.shouldBeVisible(); // No TypeScript error
runtimeTree.child1.grandchild.shouldBeRed(); // No TypeScript error
runtimeTree.child2.foobar; // No TypeScript error whereas it should be a TypeScript error saying that foobar does not exist
