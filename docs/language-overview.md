# Language Overview

## Introduction

The language is based on Behavior-Driven Development (BDD) with Given-When-Then keywords. It is designed to be intuitive and easy to learn.

## Sections

### Given section

The `given` section is optional and serves to establish prerequisites for the test. Prerequisites involve actions on the system, either in the form of user actions or system state changes.

- A user action starts with the `I` pronoun, followed by a verb. Actions may include a target, introduced by the `on` preposition. The target is identified as a component, chosen by specifying a path in the System Under Test (SUT) tree representation. This path is a sequence of component names separated by spaces.
- A system state change is expressed by a free-form statement which can include arguments.

User actions and system state changes can be linked using the `and` keyword.

Examples:

```
given I visit "http://localhost:3000/myapp"

given I login as "user1"

given I click on navigation menu and I click on dropdown menu item "About"

given the task list has 3 tasks
```

### When section

The when section is a mandatory component that specifically outlines user actions crucial for the test scenario.

This section adheres to the same structured approach employed in the `given` section for specifying user actions within the test scenario. Likewise, actions within the `when` section can be connected using the `and` keyword.

Examples:

```
when I click on welcome page greet button

when I type "John" in welcome page name input and click on welcome page greet button
```

### Then section

The `then` section, also mandatory, is used to express expectations regarding the system state, such as message visibility or the disabled status of a text input. Expectations can be linked with the `and` keyword.

These expectations are conveyed by selecting a component and defining an assertion to execute.

Assertions, whether built-in or custom, are consistently identified by the keyword should.

Examples:

```
then welcome message should be visible

then welcome message should be visible and it should have fragment highlighted "John"

then welcome page name input should be disabled

then login form should be visible and it should display the error message "Invalid credentials"
```

## Quoted text and numbers

Quoted text and numbers are used to specify values for parameters in the test sentences.

Parameters can be used in selectors, actions, and assertions.

Examples:

```
given I visit "http://localhost:3000/myapp"

when I click on menu item with text "edit"

then task with title "Buy milk" should exist

then task list should have 3 tasks
```

## Keywords

### `it`

The `it` keyword is used to refer to the component selected in the previous step.

Examples:

```
then welcome message should be visible and it should have fragment highlighted "John"

then logout button should be visible and it should be disabled
```

### `its`

The `its` keyword is used to refer to the component selected in the previous step for the purpose of selecting a child component.

Examples:

```
then login form should be visible and its submit button should be disabled

then welcome message should be visible and its close button should be focused
```
