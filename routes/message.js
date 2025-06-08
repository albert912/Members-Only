const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Show form to create a new message
router.get('/message', isLoggedIn, (req, res) => {
  res.render('message', { errors: [], oldInput: {} });
});

// Handle form submission for new message
router.post('/message', isLoggedIn, async (req, res) => {
  const { title, content } = req.body;
  const errors = [];

  if (!title || title.trim() === '') {
    errors.push({ msg: 'Title is required' });
  }
  if (!content || content.trim() === '') {
    errors.push({ msg: 'Content is required' });
  }

  if (errors.length > 0) {
    return res.render('message', { errors, oldInput: { title, content } });
  }

  try {
    await db.createMessage({
      user_id: req.session.userId,
      title: title.trim(),
      content: content.trim(),
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    errors.push({ msg: 'Error saving message' });
    res.render('message', { errors, oldInput: { title, content } });
  }
});

module.exports = router;
