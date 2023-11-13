import React, {useEffect, useState} from 'react';
import './App.css';
import Login from './components/Login';
import Task from './components/Task';

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const handleLogin = (userData) => {
    setUser(userData);
    setError(null);
  };

  const handleLogout = () => {
    setUser(null);
    setError(null);
    setTasks([]);
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    // Fetch user-specific tasks
    fetch(`/api/tasks`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`, // Include JWT token
      },
    })
        .then((response) => response.json())
        .then((data) => setTasks(data))
        .catch((error) => console.error('Error fetching tasks:', error));
  }, [user]); // Fetch tasks when component mounts

  const addTask = () => {
    if (newTask.trim() !== '') {
      // Create a new task with the logged-in user's ID
      fetch(`/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: newTask, userId: user.username }),
      })
          .then((response) => response.json())
          .then((data) => setTasks([...tasks, data]))
          .catch((error) => console.error('Error adding task:', error));

      setNewTask('');
    }
  };


  const handleDeleteTask = (task) => {
    // Create a new task with the logged-in user's ID
    fetch(`/api/tasks/${task.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
        .then((response) => response.json())
        .then((data) => {
          if (data) setTasks(data)
        })
        .catch((error) => console.error('Error adding task:', error));
  };

  return (
      <div className="App">
        {user ? (
            <div>
              <h1>Welcome, {user.username}!</h1>
              <button onClick={handleLogout}>Logout</button>

              <h2>Your tasks</h2>
              <input
                  className="new-task-title"
                  type="text"
                  placeholder="Enter a new task"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
              />
              <button className="add-task-button" onClick={addTask}>Add Task</button>
              <div>
                {tasks.map((task, index) => (
                    <Task
                        key={index}
                        task={task}
                        onDelete={() => handleDeleteTask(task)}
                    />
                ))}
              </div>
            </div>
        ) : (
            <div>
              <Login onLogin={handleLogin} setError={setError} />
              {error && <div style={{ color: 'red' }}>{error}</div>}
            </div>
        )}
      </div>
  );
}

export default App;
