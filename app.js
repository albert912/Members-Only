const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const db = require('./models/db');
const routes = require('./routes/index');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());  // Add this if you expect JSON requests
app.use(express.static('public'));

app.use(session({ 
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false, 
    saveUninitialized: true,
    // cookie: { secure: true }  // Uncomment this if using HTTPS
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await db.getUserByEmail(email);
        if (!user) return done(null, false, { message: 'Incorrect email' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: 'Incorrect password' });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.getUserById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Error handling middleware (for unexpected errors)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
