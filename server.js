
require('dotenv').config();

const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { exe } = require('./db');

const app = express();

// Trust Render Proxy
app.set('trust proxy', 1);

// Create Folders
fs.mkdirSync(path.join(__dirname, 'public/uploads'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'tmp'), { recursive: true });

// ==============================
// EMAIL CONFIGURATION
// ==============================

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// ==============================
// BASIC MIDDLEWARE
// ==============================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==============================
// FILE UPLOAD
// ==============================

app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp')
}));

// ==============================
// SESSION
// ==============================

app.use(session({
    secret: process.env.SESSION_SECRET || 'alexa-portfolio-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: 'auto',
        sameSite: 'lax'
    }
}));

// ==============================
// VISITOR EMAIL NOTIFICATION
// ==============================

app.use((req, res, next) => {

    // Skip Admin
    if (req.originalUrl.startsWith('/admin')) {
        return next();
    }

    // Homepage Only
    if (req.path !== '/') {
        return next();
    }

    // Send Email Only Once Per Session
    if (req.session.visitorEmailSent) {
        return next();
    }

    req.session.visitorEmailSent = true;

    const visitTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
    });

    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        subject: '🔔 New Visitor on Your Portfolio',
        text: `
New visitor visited your portfolio website.

Website: My Personal Portfolio
Date & Time: ${visitTime}
Page: ${req.originalUrl}

Your portfolio has received a new visitor.
        `
    }, (error, info) => {

        if (error) {
            console.log('❌ Visitor Email Error:', error.message);
        } else {
            console.log('✅ Visitor Email Sent Successfully');
        }

    });

    next();
});

// ==============================
// VISITOR COUNTER
// ==============================

app.use(async (req, res, next) => {

    // Skip Admin
    if (req.originalUrl.startsWith('/admin')) {
        return next();
    }

    // Count Only Once Per Session
    if (req.session.visitorCounted) {
        return next();
    }

    try {

        await exe(
            'INSERT INTO website_visitors (visit_date) VALUES (CURDATE())'
        );

        req.session.visitorCounted = true;

        console.log('✅ Visitor Count Updated');

    } catch (err) {
        console.log('❌ Visitor Error:', err.message);
    }

    next();
});

// ==============================
// STATIC FILES
// ==============================

app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// EJS SETTINGS
// ==============================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==============================
// ROUTES
// ==============================

const website = require('./routes/website');
const admin = require('./routes/admin');

app.use('/', website);
app.use('/admin', admin);

// ==============================
// 404
// ==============================

app.use((req, res) => {
    res.status(404).send('Page not found');
});

// ==============================
// ERROR HANDLER
// ==============================

app.use((err, req, res, next) => {

    console.log('Error:', err.message);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).send('Something went wrong!');
});

// ==============================
// START SERVER
// ==============================

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
