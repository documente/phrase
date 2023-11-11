import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setError(null);
  };

  const handleLogout = () => {
    setUser(null);
    setError(null);
  };

  return (
      <div className="App">
        {user ? (
            <div>
              <h1>Welcome, {user.username}!</h1>
              <button onClick={handleLogout}>Logout</button>
              {/* Your main application content goes here */}
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
