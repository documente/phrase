
const context = {
  welcomeMessage: '.welcome-message',
  loginForm: {
    _selector: '.form',
    loginField: '.login',
    passwordField: '.password',
    confirmButton: '.confirm-button',
  },
  tasksPanel: {
    _selector: '.tasks-panel',
    title: '.title',
    taskList: {
      _selector: '.task-list',
      taskRow: {
        _selector: (index) => `.task-row:nth-child(${index})`,
        title: '.title',
        completeCheckbox: '.complete-checkbox',
        deleteButton: '.delete-button',
        shouldBeCompleted() {}
      }
    }
  }
};

test('should resolve a root node', () => {
  const fragments = ['welcome', 'message'];
  expect(resolve(fragments, context)).toEqual(['welcomeMessage']);
});
