import React from 'react';

const Task = ({ task, onComplete, onDelete }) => {
  return (
      <div>
        <input type="checkbox" checked={task.completed} onChange={onComplete} />
        <span>{task.title}</span>
        <button onClick={onDelete}>Delete</button>
      </div>
  );
};

export default Task;
