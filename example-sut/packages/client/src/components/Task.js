import React from 'react';
import './Task.css';

const Task = ({ task, onComplete, onDelete, onClick }) => {
  return (
      <div className="task">
        <input type="checkbox" checked={task.completed} onChange={onComplete} />
        <span className="title" data-test-title={task.title} onClick={onClick}>{task.title}</span>
        <button className="delete-button" onClick={onDelete}></button>
      </div>
  );
};

export default Task;
