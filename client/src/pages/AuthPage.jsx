import { useState } from 'react';
import api from '../api';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Edge case: prevent double-click ---
    if (loading) return;

    // --- Edge case: trim username, validate before sending ---
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Username is required.');
      return;
    }
    if (!isLogin && trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!isLogin && !/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (!isLogin && password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, { username: trimmedUsername, password });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Edge case: clear errors and fields when switching modes ---
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="logo-text">Laundry<span>Pro</span></div>
        <h1>{isLogin ? 'Welcome back' : 'Create account'}</h1>
        <p className="subtitle">
          {isLogin ? 'Sign in to manage your orders' : 'Register to get started'}
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="form-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={30}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? 1 : 4}
              maxLength={72}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={toggleMode}>
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
