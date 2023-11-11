type Assertions = {
  [name: string]: () => void;
};

type Children = {
  [name: string]: TreeNode;
};

type TreeNode = {
  selector: string;
  assertions: Assertions;
  children: Children;
};

type Proxified<T extends TreeNode> =
    T extends { children: infer C }
        ? { [K in keyof C]: Proxified<C[K] & TreeNode>; } & T['assertions']
        : T['assertions'];

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
          children: {},
          assertions: {
            shouldBeRed() {},
          },
        },
      },
    },
    child2: {
      selector: '.child2',
      children: {},
      assertions: {},
    },
  },
} satisfies TreeNode;

const runtimeTree: Proxified<typeof tree> = {} as Proxified<typeof tree>;

runtimeTree.shouldBeClickable();
runtimeTree.child1.shouldBeVisible();
runtimeTree.child1.grandchild.shouldBeRed();
runtimeTree.child2.foobar; // No TypeScript error whereas it should be a TypeScript error saying that foobar does not exist


type Proxified2<T extends TreeNode> =
    T extends { children: infer C; assertions: infer A }
        // ? { [K in keyof C as T['children'][K] extends TreeNode ? K : never]: Proxified2<C[K] & TreeNode>; } & { [K in keyof A as T['assertions'][K] extends Function ? K : never]: A[K]; }
        ? { [K in keyof C]: Proxified2<C[K] & TreeNode>; } & { [K in keyof A]: A[K]; }
        : never;

const runtimeTree2: Proxified2<typeof tree> = {} as Proxified2<typeof tree>;

runtimeTree2.child1.grandchild.shouldBeRed();
runtimeTree2.child1.shouldBeVisible();
runtimeTree2.child2;
runtimeTree2.shouldBeClickable();
runtimeTree2.child1.shouldBeVisible();
runtimeTree2.fekofk();
runtimeTree2.child1.fjioejzf();
runtimeTree2.child1.grandchild.fjioejzf();
