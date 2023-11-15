import {withTree} from '../../../lib/dist/cy-runner';

const test = withTree({
  loginForm: {
    _selector: '.login-form',
    loginField: 'input[type="text"]',
    passwordField: 'input[type="password"]',
    confirmButton: 'button[type="submit"]',
  },
  loginErrorMessage: '.error-message',
  welcomeMessage: '.welcome-message',
  newTaskTitleField: '.new-task-title',
  addTaskButton: '.add-task-button',
  taskWithText: {
    _selector: (text) => `.task[data-test-title="${text}"]`,
    title: '.title',
    deleteButton: '.delete-button',
  },
  taskList: {
    _selector: '.task-list',
    shouldHave_Task(self, count) {
      self.children().should('have.length', count);
    }
  }
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

  it('should show an error message when username is missing', () => {
    test `when I visit "${baseUrl}"
           and I type "${username}" on login form login field
           and I click on login form confirm button
          then login error message should be visible
           and it should have text "Please enter a username and password"`;
  });

  it('should show an error message when password is missing', () => {
    test `when I visit "${baseUrl}"
           and I type "${password}" on login form password field
           and I click on login form confirm button
          then login error message should be visible
           and it should have text "Please enter a username and password"`;
  });

  it('should add a task', () => {
    test `given I visit "${baseUrl}"
            and I type "${username}" on login form login field
            and I type "${password}" on password field
            and I click on login form confirm button
           when I type "Buy milk" on new task title field
            and I click on add task button
           then task with text "Buy milk" should exist
            and task list should have 1 task`;
  });

  it('should remove a task', () => {
    test `given I visit "${baseUrl}"
            and I type "${username}" on login form login field
            and I type "${password}" on password field
            and I click on login form confirm button
            and I type "Buy milk" on new task title field
            and I click on add task button
           when I click on task with text "Buy milk" delete button
           then task list should have 0 task`;
  });
})