type Children = {
  [name: string]: TreeNode;
};

type TreeNode = {
  selector: string;
  children?: Children;
  assertions?: {};
};

type Proxified<T extends TreeNode> = (
    T extends { children: infer C; }
        ? { [K in keyof C as C[K] extends TreeNode ? K : never]: Proxified<C[K] & TreeNode>; }
        : {}) & (
    T extends { assertions: infer A; }
        ? { [K in keyof A as A[K] extends Function ? K : never]: A[K]; }
        : {});

const tree = {
  selector: 'button',
  assertions: {
    shouldBeClickable() {},
  },
  children: {
    child1: {
      selector: '.child1',
      assertions: {
        shouldBeVisible() {},
      },
      children: {
        grandchild: {
          selector: '.grandchild',
          assertions: {
            shouldBeRed() {},
            toto: 'titi'
          }
        },
      },
    },
    child2: {
      selector: '.child2',
    },
  },
} satisfies TreeNode;

const runtimeTree = {} as Proxified<typeof tree>;

runtimeTree.child1.grandchild;
runtimeTree.child1.shouldBeVisible();
runtimeTree.shouldBeClickable();
runtimeTree.child1.grandchild.shouldBeRed();
runtimeTree.child1.grandchild.toto;
runtimeTree.child2.foobar; // TS2339: Property  foobar  does not exist on type  {}
runtimeTree.child1.foobar();
