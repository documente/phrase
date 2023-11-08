const pageObjects = {
  button: {
    selector: 'button',
    label: 'Click me',
  },
  input: 'input',
  link: 'a',
  text: 'p',
}

type targets = keyof typeof pageObjects;

interface When<R, P> {
  I: WhenI<R, P>;
}

interface WhenI<R, P> {
  clickOn(): Action<R, P>;
  typeOn(): Action<R, P>;
  hoverOn(): Action<R, P>;
}

type RootActionTarget<R, P> = {
  [target in keyof R]: ActionTarget<R, R[target]>;
}

type SubActionTarget<R, P> = {
  [target in keyof P]: ActionTarget<R, P[target]>;
}

type Action<R, P> = RootActionTarget<R, P> & SubActionTarget<R, P> & {
  it: ActionTarget<R, P>;
  then: Then<R, P>;
  and: When<R, P>;
}

type ActionTarget<R, P> = SubActionTarget<R, P> & {
  text(text: string): ActionArgument<R, P>;
  and: When<R, P>;
  then: Then<R, P>;
}

interface ActionArgument<R, P> {
  then: Then<R, P>;
}


type RootAssertTarget<R, P> = {
  [target in keyof R]: AssertTarget<R, R[target]>;
}

type SubAssertTarget<R, P> = {
  [target in keyof P]: AssertTarget<R, P[target]>;
}

type Then<R, P> = RootAssertTarget<R, P> & SubAssertTarget<R, P> & {
  it: AssertTarget<R, P>;
}

type AssertTarget<R, P> = SubAssertTarget<R, P> & {
  shouldBeVisible(): Assertion<R, P>;
}

interface Assertion<R, P> {
  and: Then<R, P>;
}

let when: When<typeof pageObjects, typeof pageObjects>;
when.I.clickOn().button
    .and.I.typeOn().input.text('hello')
    .then.button.shouldBeVisible()
    .and.button.selector.shouldBeVisible();