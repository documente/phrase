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
// runtimeTree.child1.grandchild.toto;
// runtimeTree.child2.foobar; // TS2339: Property  foobar  does not exist on type  {}
// runtimeTree.child1.foobar();



type Targeting<R extends TreeNode, N extends TreeNode, PR = Proxified<R>, PN = Proxified<N>> =
    { [target in keyof PR]: SubTargeting<R, N>; }
    & { [target in keyof PN]: SubTargeting<R, N>; };

type SubTargeting<R extends TreeNode, N extends TreeNode, PR = Proxified<R>, PN = Proxified<N>> =
    { [target in keyof PN]: SubTargeting<R, N>; };

interface When<R extends TreeNode, P extends TreeNode> {
  I: WhenI<R, P>;
}

interface WhenI<R extends TreeNode, P extends TreeNode> {
  clickOn(): Action<R, P>;
  typeOn(): Action<R, P>;
  hoverOn(): Action<R, P>;
}

type Action<R extends TreeNode, P extends TreeNode> = Proxified<R> & {
  // it: ActionTarget<R, P>;
  // then: Then<R, P>;
  and: When<R, P>;
}

const when = {} as When<typeof tree, typeof tree>;

when.I.clickOn().child2;

// when I click on child1 grandchild then it should be red