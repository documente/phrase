module.exports = {
  taskListIsEmpty() {
    cy.request('DELETE', 'http://localhost:5000/api/all-tasks');
  }
};
