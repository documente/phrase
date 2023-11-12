// Example: src/components/Login.js
import React, { useState } from 'react';

const Login = ({ onLogin, setError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (username?.length === 0 || password?.length === 0) {
      setError('Please enter a username and password');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid credentials');
        } else {
          setError('Login failed');
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        localStorage.setItem('token', result.token)
        onLogin({username});
      } else {
        setError('Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Login failed');
    }
  };

  return (
      <div>
        <h2>Login</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <label>
            Username:
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <br />
          <label>
            Password:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <br />
          <button type="submit">Login</button>
        </form>
      </div>
  );
};

export default Login;
