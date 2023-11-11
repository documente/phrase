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

// For all other routes, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
