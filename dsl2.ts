type Children = {
  [name: string]: TreeNode;
};

type TreeNode = {
  _selector: string;
  _children?: Children;
};

type Proxified<T extends TreeNode> = T extends { _children: infer C }
    ? {
      [K in keyof C]: Proxified<C[K] & TreeNode>;
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