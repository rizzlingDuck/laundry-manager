const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    // --- Edge case: missing body ---
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // --- Edge case: ensure strings ---
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password must be strings.' });
    }

    const trimmedUsername = username.trim();

    // --- Edge case: whitespace-only username ---
    if (!trimmedUsername) {
      return res.status(400).json({ error: 'Username cannot be empty or whitespace.' });
    }

    // --- Edge case: username length limits ---
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (trimmedUsername.length > 30) {
      return res.status(400).json({ error: 'Username must be under 30 characters.' });
    }

    // --- Edge case: username format (alphanumeric + underscores only) ---
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }

    // --- Edge case: password length validation ---
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }
    // --- Edge case: bcrypt DoS — bcrypt only uses first 72 bytes ---
    if (password.length > 72) {
      return res.status(400).json({ error: 'Password must be under 72 characters.' });
    }

    const db = getDb();

    // Check if user already exists (case-insensitive)
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(trimmedUsername);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).run(trimmedUsername, password_hash);

    const user = { id: result.lastInsertRowid, username: trimmedUsername };
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully.',
      user: { id: user.id, username: user.username },
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/login
 * Login and receive JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // --- Edge case: ensure strings ---
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password must be strings.' });
    }

    // --- Edge case: prevent bcrypt DoS on login too ---
    if (password.length > 72) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const trimmedUsername = username.trim();

    const db = getDb();
    // --- Edge case: case-insensitive login ---
    const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(trimmedUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken({ id: user.id, username: user.username });

    res.json({
      message: 'Login successful.',
      user: { id: user.id, username: user.username },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
