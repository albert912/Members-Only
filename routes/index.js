const express = require('express');
const router = express.Router();
const passport = require('passport');
const db = require('../models/db');

// Import signup router
const signupRouter = require('./signup');
router.use('/', signupRouter);

// --- LOGIN ROUTES ---
router.get('/login', (req, res) => {
    res.render('login', { error: req.flash('error') });
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

// --- JOIN CLUB ROUTES ---
router.get('/join', (req, res) => {
    res.render('join', { error: null });
});

router.post('/join', (req, res) => {
    const code = req.body.code;
    if (!req.user) {
        return res.redirect('/login');
    }

    if (code === process.env.CLUB_CODE) {
        db.setMemberStatus(req.user.id)
          .then(() => {
              res.redirect('/');
          })
          .catch(err => {
              console.error(err);
              res.render('join', { error: 'Something went wrong.' });
          });
    } else {
        res.render('join', { error: 'Wrong code!' });
    }
});

// --- NEW MESSAGE ROUTES ---
router.get('/new-message', (req, res) => {
    if (!req.user) return res.redirect('/login');
    if (!req.user.member) return res.redirect('/join');
    res.render('new-message', { error: null });
});

router.post('/new-message', async (req, res) => {
    if (!req.user) return res.redirect('/login');
    if (!req.user.member) return res.redirect('/join');

    try {
        await db.createMessage({
            user_id: req.user.id,
            title: req.body.title,
            content: req.body.content
        });
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('new-message', { error: 'Failed to create message.' });
    }
});

// --- DELETE MESSAGE ROUTE ---
router.post('/delete/:id', async (req, res) => {
    if (req.user?.admin) {
        try {
            await db.deleteMessage(req.params.id);
        } catch (err) {
            console.error(err);
        }
    }
    res.redirect('/');
});

// --- LOGOUT ROUTE ---
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) return next(err);
        res.redirect('/');
    });
});

// --- HOME PAGE ---
router.get('/', async (req, res) => {
    try {
        let messages = await db.getMessages();

        // Filter messages based on user membership status
        // For logged out or non-members, hide author name and timestamp
        if (!req.user || !req.user.member) {
            // Map messages to exclude author and timestamp info
            messages = messages.map(msg => ({
                id: msg.id,
                title: msg.title,
                content: msg.content,
                first_name: null,
                last_name: null,
                timestamp: null
            }));
        }
        // Admin can see everything, members see author and timestamp

        res.render('index', { messages, user: req.user });
    } catch (err) {
        console.error(err);
        res.render('index', { messages: [], user: req.user });
    }
});

// --- ADMIN USERS LIST ROUTE ---
router.get('/admin/users', async (req, res) => {
    if (!req.user || !req.user.admin) {
        return res.redirect('/');
    }
    try {
        const users = await db.getAllUsers();
        res.render('admin-users', { users, user: req.user });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// --- PROMOTE USER TO ADMIN ROUTE ---
router.post('/admin/users/promote/:id', async (req, res) => {
    if (!req.user || !req.user.admin) {
        return res.redirect('/');
    }
    try {
        await db.setAdminStatus(req.params.id);
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/users');
    }
});

module.exports = router;










