// TODO
//  - Add tests
//  - Better error reporting (e.g. state machine for expected fragments)
//  - Report dangling queued actions (add a "finisher" to be called in afterEach hooks)
//  - Add more actions
//  - Add more assertions
//  - Add more adapters
//  - Documentation
//  - Examples

import { SentenceContext, SentenceContextDef } from './context';
import {
  Action,
  ActionKind,
  buildClickAction, buildHoverAction,
  buildTypeAction,
} from './actions';
import {
  PageObjectNode,
  PageObjectNodeDef,
  Selector,
  transformToPageObjectNodeTree,
} from './page-objects';
import { ExtendedSentence, proxify } from './proxy';
import { Party } from './party';
import {Adapter, TestElement} from './adapter';
import { toPrettyPath } from './path';

export default class Sentence {
  readonly sentenceContext: SentenceContext;
  currentParty: Party;
  currentObjectPath: string[] = [];
  selectorArgs: Map<string, any[]> = new Map();
  queuedAction?: Action | null;

  /** Returns the currently selected PageObjectNode */
  get currentObject(): PageObjectNode {
    let currentObject = null;

    for (const name of this.currentObjectPath) {
      if (currentObject == null) {
        currentObject = this.sentenceContext.pageObjects[name];
      } else {
        currentObject = currentObject.children[name];
      }
    }

    return currentObject;
  }

  constructor(
    sentenceContext: SentenceContextDef,
    public readonly adapter: Adapter,
  ) {
    this.sentenceContext = {
      parties: { ...sentenceContext.parties },
      pageObjects: Object.keys(sentenceContext.pageObjects).reduce(
        (acc, name) => {
          const nodeDef: PageObjectNodeDef = sentenceContext.pageObjects[name];
          acc[name] = transformToPageObjectNodeTree(nodeDef, [name]);
          return acc;
        },
        {},
      ),
    };
  }

  /**
   * Creates a new sentence with a given context and adapter
   * @param sentenceContext - The context of the sentence, defining the available Page Objects and the Parties
   * @param adapter - The adapter to use for interacting with the application
   */
  public static given(
    sentenceContext: SentenceContextDef,
    adapter: Adapter,
  ): ExtendedSentence {
    validateContextDefinition(sentenceContext);
    const sentence = new Sentence(sentenceContext, adapter);
    return proxify(sentence);
  }

  /**
   * Syntax element usually used to mark a precondition or a user action.
   * If there's a queued action, it will be performed before the next action.
   */
  get when(): ExtendedSentence {
    this.performQueuedAction();
    return proxify(this);
  }
  /**
   * Syntax element usually used to mark an assertion.
   * If there's a queued action, it will be performed before the next action.
   */
  get then(): ExtendedSentence {
    this.performQueuedAction();
    return proxify(this);
  }

  /**
   * Switches the current party to the given one.
   * @param party - The party to switch to. Can be either a string (party name) or a Party object.
   */
  as: (party: Party | string) => ExtendedSentence = (party: Party | string) => {
    if (typeof party === 'string') {
      this.currentParty = this.findParty(party);
    } else {
      this.currentParty = party;
    }

    this.performQueuedAction();
    return proxify(this);
  }

  /**
   * Set the current target to the current party.
   */
  get I(): ExtendedSentence {
    // Noop
    return proxify(this);
  }

  /** Set the current target to the current object. */
  get it(): ExtendedSentence {
    // Noop
    return proxify(this);
  }

  /**
   * Syntax element to chain multiple actions or assertions.
   * If there's a queued action, it will be performed before the next action.
   */
  get and(): ExtendedSentence {
    this.performQueuedAction();
    return proxify(this);
  }

  // Assertions

  should(...args): ExtendedSentence {
    this.selectCurrentObject().should(...args);
    return proxify(this);
  }

  /**
   * Assertion to check if the current object is visible.
   */
  shouldBeVisible(): ExtendedSentence {
    return this.should('be.visible');
  }

  /**
   * Assertion to check if the current object is not visible.
   */
  shouldNotBeVisible(): ExtendedSentence {
    return this.should('not.be.visible');
  }

  /**
   * Assertion to check if the current object does not exist.
   */
  shouldNotExist(): ExtendedSentence {
    return this.should('not.exist');
  }

  /**
   * Assertion to check if the current object has a given text.
   * @param expectedText - The expected text
   */
  shouldHaveText(expectedText: string): ExtendedSentence {
    return this.should('have.text', expectedText);
  }

  // Actions

  /**
   * Action to visit a given URL.
   * @param url
   */
  visit(url: string): ExtendedSentence {
    this.adapter.visit(url);
    return proxify(this);
  }

  /**
   * Queues an action to type into the current object.
   * Next fragments should be the target object (with `it` or a page object selector)
   * and the text to type (with `text`).
   */
  get typeInto(): ExtendedSentence {
    this.queuedAction = buildTypeAction();
    return proxify(this);
  }

  /**
   * Action to click on the current object.
   */
  clickOn(): ExtendedSentence {
    this.queuedAction = buildClickAction();
    return proxify(this);
  }

  /**
   * Action to click on the current object.
   */
  hoverOn(): ExtendedSentence {
    this.queuedAction = buildHoverAction();
    return proxify(this);
  }

  // Action args

  /** Defines a text argument for actions such as `typeInto` */
  text(text: string): ExtendedSentence {
    this.selectorArgs.set(this.currentObjectPath.join(), [text]);
    return proxify(this);
  }

  /** Defines an argument for actions by looking into the current party's attributes */
  my(key: string): ExtendedSentence {
    if (!this.currentParty) {
      throw new Error(`No party selected`);
    }

    if (!Object.prototype.hasOwnProperty.call(this.currentParty, key)) {
      throw new Error(`Party does not have attribute "${key}"`);
    }

    this.selectorArgs.set(this.currentObjectPath.join(), [
      this.currentParty[key],
    ]);
    return proxify(this);
  }

  // Internal

  private findParty(name: string): Party {
    if (!this.sentenceContext.parties[name]) {
      throw new Error(`Party "${name}" does not exist`);
    }

    return this.sentenceContext.parties[name];
  }

  private flattenSelectors(): string[] {
    const selectors: string[] = [];
    const path = [];

    let node = null;

    for (const name of this.currentObjectPath) {
      path.push(name);

      if (node == null) {
        node = this.sentenceContext.pageObjects[name];
        selectors.push(this.flattenSelector(node.selector, path));
      } else {
        node = node.children[name];
        selectors.push(this.flattenSelector(node.selector, path));
      }
    }

    return selectors;
  }

  private flattenSelector(selector: Selector, path: string[]): string {
    if (typeof selector === 'function') {
      return selector(...this.selectorArgs.get(path.join()));
    } else {
      return selector;
    }
  }

  private performQueuedAction(): void {
    const queuedAction = this.queuedAction;
    const kind = queuedAction?.kind;

    if (kind === undefined) {
      return;
    }

    switch (kind) {
      case ActionKind.click:
        this.click();
        break;
      case ActionKind.hover:
        this.hover();
        break;
      case ActionKind.type:
        const text = this.selectorArgs.get(this.currentObjectPath.join());

        if (!text || text.length === 0) {
          throw new Error(`No text provided for type action`);
        }

        this.typeText(text[0]);
        break;
      default:
        throw new Error(`Unknown action kind "${kind}"`);
    }

    this.queuedAction = null;
  }

  private click(): ExtendedSentence {
    this.selectCurrentObject().click();
    return proxify(this);
  }

  private hover(): ExtendedSentence {
    const el = this.selectCurrentObject();
    el.trigger('mouseenter');
    el.trigger('mouseover');
    return proxify(this);
  }

  private typeText(text: string): ExtendedSentence {
    this.selectCurrentObject().type(text);
    return proxify(this);
  }

  selectCurrentObject(): TestElement {
    return this.adapter.select(this.flattenSelectors());
  }
}

export function validateContextDefinition(sentenceContext: any): void {
  if (sentenceContext.pageObjects == null) {
    throw new Error('Missing pageObjects');
  }

  Object.keys(sentenceContext.pageObjects).forEach((name) => {
    validateNodeDefinition(name, [name], sentenceContext.pageObjects[name]);
  });

  if (sentenceContext.parties == null) {
    throw new Error('Missing parties');
  }
}

function validateNodeDefinition(
  name: string,
  path: string[],
  nodeDef: PageObjectNodeDef,
): void {
  validateNodeName(name, path);

  if (typeof nodeDef === 'string') {
    return;
  }

  if (typeof nodeDef === 'function') {
    return;
  }

  if (nodeDef.selector == null) {
    throw new Error(
      `Missing selector for node at path "${toPrettyPath(path)}"`,
    );
  }

  const children = nodeDef.children;

  if (children != null) {
    Object.keys(children).forEach((childName) => {
      validateNodeDefinition(childName, [...path, childName], children[childName]);
    });
  }
}

function validateNodeName(name: string, path: string[]): void {
  if (name.includes(' ')) {
    throw new Error(
      `Node name "${name}" contains spaces at path "${toPrettyPath(path)}"`,
    );
  }

  // We technically could allow any valid JS identifier, but the check
  // is quite complex
  if (!name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
    throw new Error(
      `Node name "${name}" contains invalid characters at path "${toPrettyPath(
        path,
      )}"`,
    );
  }

  // We could also check for JS reserved words here, but the error would be
  // quickly detected by the user anyway

  if (isReservedWord(name)) {
    throw new Error(
      `Node name "${name}" is a reserved word at path "${toPrettyPath(path)}"`,
    );
  }
}

function isReservedWord(name: string): boolean {
  // Dirty and inefficient check, but it's good enough for now and doesn't
  // risk to be out of sync
  const isSentenceMethod = Object.getOwnPropertyNames(
    Sentence.prototype,
  ).includes(name);

  if (isSentenceMethod) {
    return true;
  }

  return ['selector', 'children'].includes(name);
}
