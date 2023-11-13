import React from 'react';

const Task = ({ task, onComplete, onDelete }) => {
  return (
      <div className="task">
        <input type="checkbox" checked={task.completed} onChange={onComplete} />
        <span data-test-title={task.title}>{task.title}</span>
        <button onClick={onDelete}>Delete</button>
      </div>
  );
};

export default Task;
