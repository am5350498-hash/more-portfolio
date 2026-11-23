
const express = require('express');
const router = express.Router();

const { exe } = require('../db');

router.use(express.urlencoded({ extended: true }));

// Home
router.get('/', async (req, res) => {
    try {
        const hero = await exe('SELECT * FROM hero');
        res.render('website/home.ejs', { hero: hero[0] });
    } catch (err) {
        console.log('Home Error:', err);
        res.status(500).send('Database Error');
    }
});

// About
router.get('/about', async (req, res) => {
    try {
        const about = await exe('SELECT * FROM about');
        res.render('website/about.ejs', { about: about[0] });
    } catch (err) {
        console.log('About Error:', err);
        res.status(500).send('Database Error');
    }
});

// Resume
router.get('/resume', async (req, res) => {
    try {
        const skill = await exe('SELECT * FROM technical_skills');
        const experience = await exe('SELECT * FROM experience');
        const education = await exe('SELECT * FROM education');

        res.render('website/resume.ejs', {
            skill: skill,
            experience: experience,
            education: education
        });
    } catch (err) {
        console.log('Resume Error:', err);
        res.status(500).send('Database Error');
    }
});

// Services
router.get('/services', async (req, res) => {
    try {
        const services = await exe('SELECT * FROM services');
        res.render('website/services', { services: services });
    } catch (err) {
        console.log('Services Error:', err);
        res.status(500).send('Database Error');
    }
});

// Portfolio
router.get('/portfolio', async (req, res) => {
    try {
        const portfolio = await exe('SELECT * FROM porfolio');
        const blog = await exe('SELECT * FROM blog');

        res.render('website/portfolio', {
            portfolio: portfolio,
            blog: blog
        });
    } catch (err) {
        console.log('Portfolio Error:', err);
        res.status(500).send('Database Error');
    }
});

// Contact
router.get('/contact', async (req, res) => {
    try {
        const contact = await exe('SELECT * FROM contact');
        res.render('website/contact.ejs', { contact: contact[0] });
    } catch (err) {
        console.log('Contact Error:', err);
        res.status(500).send('Database Error');
    }
});

// Save Contact
router.post('/save_contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const status = 'pending';

        const date = new Date()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');

        const sql = `
            INSERT INTO contact_save
            (cname, cemail, csubject, cmessage, cstatus, cdate)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await exe(sql, [
            name,
            email,
            subject,
            message,
            status,
            date
        ]);

        res.redirect('/contact');
    } catch (err) {
        console.log('Save Contact Error:', err);
        res.status(500).send('Contact Save Error');
    }
});

// Testimonials
router.get('/testimonials', async (req, res) => {
    try {
        const testimonial = await exe('SELECT * FROM testimonial');

        res.render('website/testimonials.ejs', {
            testimonial: testimonial
        });
    } catch (err) {
        console.log('Testimonials Error:', err);
        res.status(500).send('Database Error');
    }
});

// Blog
router.get('/blog', async (req, res) => {
    try {
        const blog = await exe('SELECT * FROM blog');
        res.render('website/blog.ejs', { blog: blog });
    } catch (err) {
        console.log('Blog Error:', err);
        res.status(500).send('Database Error');
    }
});

module.exports = router;
