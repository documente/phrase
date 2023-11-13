import {withTree} from '../../../lib/dist/cy-runner';

const test = withTree({
  loginForm: {
    _selector: '.login-form',
    loginField: 'input[type="text"]',
    passwordField: 'input[type="password"]',
    confirmButton: 'button[type="submit"]',
  },
  welcomeMessage: 'h1',
  newTaskTitleField: '.new-task-title',
  addTaskButton: '.add-task-button',
  taskWithText: (text) => `.task [data-test-title="${text}"]`
});

const baseUrl = 'http://localhost:3000/';
const username = 'user01';
const password = 'P455w0rd';

describe('example spec', () => {
  beforeEach(() => {
    // Quick and dirty way to reset the server state
    cy.request('DELETE', 'http://localhost:5000/api/all-tasks');
  });

  it('should login', () => {
    test `when I visit "${baseUrl}"
           and I type "${username}" on login form login field
           and I type "${password}" on password field
           and I click on login form confirm button
          then welcome message should be visible
           and it should have text "Welcome, ${username}!"
           and login form should not exist`;
  });

  it('should add a task', () => {
    test `given I visit "${baseUrl}"
            and I type "${username}" on login form login field
            and I type "${password}" on password field
            and I click on login form confirm button
           when I type "Buy milk" on new task title field
            and I click on add task button
           then task with text "Buy milk" should exist`;
  });
})