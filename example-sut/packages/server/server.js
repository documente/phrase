const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your-secret-key';

app.use(bodyParser.json());

const tasks = [];

// Middleware to verify JWT and extract user ID
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization.replace('Bearer ', '');

  console.log('token', token);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

app.post('/api/login', (req, res) => {
  // Implement user authentication and return a JWT
  const { username, password } = req.body;
  const user = { userId: username };
  const token = jwt.sign(user, SECRET_KEY);
  res.json({ success: true, token });
});

app.get('/api/tasks', authenticateUser, (req, res) => {
  const userTasks = tasks.filter((task) => task.userId === req.userId);
  console.log('get user tasks', tasks)
  res.json(userTasks);
});

app.post('/api/tasks', authenticateUser, (req, res) => {
  const newTask = { ...req.body, userId: req.userId };
  tasks.push(newTask);
  console.log('add task, tasks', tasks)
  res.json(newTask);
});

app.delete('/api/tasks', authenticateUser, (req, res) => {
  const toRemove = tasks.find(task => task.title === req.body.task.title && task.userId === req.userId);

  if (!toRemove) {
    return res.status(404).json({ message: 'Task not found' });
  }

  tasks.splice(tasks.indexOf(toRemove), 1);
  console.log('removed task, tasks', tasks)
  const userTasks = tasks.filter((task) => task.userId === req.userId);
  res.json(userTasks);
});

// Other routes...

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
