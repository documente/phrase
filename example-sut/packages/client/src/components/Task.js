import React from 'react';
import './Task.css';

const Task = ({ task, onComplete, onDelete, onClick }) => {
  return (
      <div className="task" data-test-title={task.title}>
        <input type="checkbox" checked={task.completed} onChange={onComplete} />
        <span className="title" onClick={onClick}>{task.title}</span>
        <button className="delete-button" onClick={onDelete}></button>
      </div>
  );
};

export default Task;
