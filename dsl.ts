const pageObjects = {
  button: {
    _selector: 'button',
    label: 'Click me',
  },
  input: 'input',
  link: 'a',
  text: 'p',
}

interface When<R, P> {
  I: WhenI<R, P>;
}

interface WhenI<R, P> {
  clickOn(): Action<R, P>;
  typeOn(): Action<R, P>;
  hoverOn(): Action<R, P>;
}

type RootActionTarget<R, P> = {
  [target in keyof R]: Omit<ActionTarget<R, R[target]>, '_selector'>;
}

type SubActionTarget<R, P> = {
  [target in keyof P]: Omit<ActionTarget<R, P[target]>, '_selector'>;
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
  [target in keyof R]: Omit<AssertTarget<R, R[target]>, '_selector'>;
}

type SubAssertTarget<R, P> = {
  [target in keyof P]: Omit<AssertTarget<R, P[target]>, '_selector'>;
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
    .and.label.shouldBeVisible()
    .and.input.shouldBeVisible()
    .and.button.label.shouldBeVisible();