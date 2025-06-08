const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const router = express.Router();

router.get('/signup', (req, res) => {
    res.render('signup', { errors: [], oldInput: {} });
});

router.post('/signup', [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('signup', { errors: errors.array(), oldInput: req.body });
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        await db.createUser({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: hashedPassword,    // Correct field name
            membershipStatus: false,      // default new user status
            admin: false
        });

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('signup', { errors: [{ msg: "Error creating user" }], oldInput: req.body });
    }
});

module.exports = router;
