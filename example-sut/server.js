const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

app.use(express.json());

// Serve static files from the 'client/build' directory
app.use(express.static(path.join(__dirname, 'client/build')));

app.post('/api/message', (req, res) => {
  const { text } = req.body;
  console.log('Received message:', text);
  res.json({ success: true, message: `Received message: ${text}` });
});


// For simplicity, assume any login attempt is successful
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Validate the username and password (you should hash the password in a real-world scenario)
  // For simplicity, accept any username/password
  if (username?.length > 0 && password?.length > 0) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// For all other routes, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
