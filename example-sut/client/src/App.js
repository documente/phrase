import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const sendMessage = async () => {
    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message }),
      });
      const result = await response.json();
      setResponse(result.message);
    } catch (error) {
      console.error('Error sending message:', error);
      setResponse('Error sending message');
    }
  };

  return (
      <div className="App">
        <h1>Simple SPA</h1>
        <label>
          Message:
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        <button onClick={sendMessage}>Send Message</button>
        <div>
          <strong>Response:</strong> {response}
        </div>
      </div>
  );
}

export default App;
