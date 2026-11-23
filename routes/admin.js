const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { exe } = require('../db');

// =====================
// UPLOAD FOLDER
// =====================
const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// =====================
// HELPERS
// =====================

// Async errors handle
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Admin session check
function session_check(req, res, next) {
    if (req.session && req.session.lid) {
        return next();
    }
    res.redirect('/admin/login');
}

// Get uploaded image
function getFile(req, field) {
    if (!req.files || !req.files[field]) return null;

    let file = req.files[field];

    if (Array.isArray(file)) file = file[0];

    if (!file || !file.name || file.size === 0) return null;

    return file;
}

// Save uploaded image
async function saveImage(file) {
    if (!file) return '';

    const ext = path.extname(file.name).toLowerCase();

    const allowed = [
        '.jpg', '.jpeg', '.png', '.gif',
        '.webp', '.bmp', '.svg', '.ico',
        '.jfif', '.avif', '.tif', '.tiff', '.heic'
    ];

    if (!allowed.includes(ext)) {
        throw new Error('Invalid image format');
    }

    const base = path.basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 50) || 'image';

    const fileName = Date.now() + '_' + base + ext;
    const destination = path.join(UPLOAD_DIR, fileName);

    await file.mv(destination);

    return fileName;
}

// Delete image safely
function removeImage(fileName) {
    if (!fileName) return;

    const safeName = path.basename(fileName);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

// =====================
// ADMIN PROFILE DATA
// =====================
router.use(asyncHandler(async (req, res, next) =>    {
    const data = await exe('SELECT * FROM about LIMIT 1');

    res.locals.about = data[0] || {};

    next();
}));

// =====================
// DASHBOARD
// =====================
router.get('/dashboard', session_check, asyncHandler(async (req, res) => {

    const project = await exe('SELECT COUNT(*) AS total FROM porfolio');
    const blog = await exe('SELECT COUNT(*) AS total FROM blog');
    const service = await exe('SELECT COUNT(*) AS total FROM services');
    const testimonial = await exe('SELECT COUNT(*) AS total FROM testimonial');

    const pending = await exe(
        "SELECT COUNT(*) AS total FROM contact_save WHERE cstatus='pending'"
    );

    const confirm = await exe(
        "SELECT COUNT(*) AS total FROM contact_save WHERE cstatus='confirm'"
    );

    const reject = await exe(
        "SELECT COUNT(*) AS total FROM contact_save WHERE cstatus='reject'"
    );

    const visitors = await exe(
        'SELECT COUNT(*) AS total FROM website_visitors'
    );

    const monthlyData = await exe(`
        SELECT MONTH(visit_date) AS month, COUNT(*) AS total
        FROM website_visitors
        WHERE YEAR(visit_date) = YEAR(CURDATE())
        GROUP BY MONTH(visit_date)
        ORDER BY MONTH(visit_date)
    `);

    const recentProjects = await exe(
        'SELECT * FROM porfolio ORDER BY id DESC LIMIT 5'
    );

    const recentBlogs = await exe(
        'SELECT * FROM blog ORDER BY id DESC LIMIT 5'
    );

    const recentEnquiries = await exe(
        'SELECT cid, cstatus FROM contact_save ORDER BY cid DESC LIMIT 5'
    );

    res.render('admin/dashboard.ejs', {
        username: req.session.username,
        totalProjects: project[0].total,
        totalBlogs: blog[0].total,
        totalServices: service[0].total,
        totalTestimonials: testimonial[0].total,
        pendingEnquiries: pending[0].total,
        confirmEnquiries: confirm[0].total,
        rejectEnquiries: reject[0].total,
        totalVisitors: visitors[0].total,
        monthlyData,
        recentProjects,
        recentBlogs,
        recentEnquiries
    });
}));

// =====================
// LOGIN / LOGOUT
// =====================
router.get('/login', (req, res) => {
    res.render('admin/login.ejs');
});

router.post('/login_check', asyncHandler(async (req, res) => {

    const { username, password } = req.body;

    const data = await exe(
        'SELECT * FROM login WHERE username=? AND password=?',
        [username, password]
    );

    if (data.length > 0) {
        req.session.lid = data[0].lid;
        req.session.username = data[0].username;

        return res.redirect('/admin/dashboard');
    }

    res.redirect('/admin/login');
}));

router.get('/forgot', (req, res) => {
    res.render('admin/forgot.ejs');
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

// =====================
// LOGIN REQUIRED
// =====================
router.use(session_check);

// =====================
// SKILLS
// =====================
router.get('/skill_add', (req, res) => {
    res.render('admin/skill_add.ejs');
});

router.post('/skill_add_save', asyncHandler(async (req, res) => {
    const { tech_name, tech_per } = req.body;

    await exe(
        'INSERT INTO technical_skills(tech_name, tech_per) VALUES (?,?)',
        [tech_name, tech_per]
    );

    res.redirect('/admin/skill_add');
}));

router.get('/skill_list', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM technical_skills');

    res.render('admin/skill_list.ejs', {
        skill: data
    });
}));

router.get('/skill_edit/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM technical_skills WHERE ts_id=?',
        [req.params.id]
    );

    res.render('admin/skill_edit.ejs', {
        skill: data[0]
    });
}));

router.post('/skill_update', asyncHandler(async (req, res) => {
    const { id, tech_name, tech_per } = req.body;

    await exe(
        'UPDATE technical_skills SET tech_name=?, tech_per=? WHERE ts_id=?',
        [tech_name, tech_per, id]
    );

    res.redirect('/admin/skill_list');
}));

router.get('/skill_delete/:id', asyncHandler(async (req, res) => {
    await exe(
        'DELETE FROM technical_skills WHERE ts_id=?',
        [req.params.id]
    );

    res.redirect('/admin/skill_list');
}));

// =====================
// EXPERIENCE
// =====================
router.get('/experience_add', (req, res) => {
    res.render('admin/experience_add.ejs');
});

router.post('/experience_add_save', asyncHandler(async (req, res) => {
    const { exp_duration, exp_position, exp_company, exp_desc } = req.body;

    await exe(
        'INSERT INTO experience(exp_duration, exp_position, exp_company, exp_desc) VALUES (?,?,?,?)',
        [exp_duration, exp_position, exp_company, exp_desc]
    );

    res.redirect('/admin/experience_add');
}));

router.get('/experience_list', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM experience');

    res.render('admin/experience_list.ejs', {
        experience: data
    });
}));

router.get('/experience_edit/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM experience WHERE eid=?',
        [req.params.id]
    );

    res.render('admin/experience_edit.ejs', {
        experience: data[0]
    });
}));

router.post('/experience_update', asyncHandler(async (req, res) => {
    const { id, exp_duration, exp_position, exp_company, exp_desc } = req.body;

    await exe(
        'UPDATE experience SET exp_duration=?, exp_position=?, exp_company=?, exp_desc=? WHERE eid=?',
        [exp_duration, exp_position, exp_company, exp_desc, id]
    );

    res.redirect('/admin/experience_list');
}));

router.get('/experience_delete/:id', asyncHandler(async (req, res) => {
    await exe(
        'DELETE FROM experience WHERE eid=?',
        [req.params.id]
    );

    res.redirect('/admin/experience_list');
}));

// =====================
// EDUCATION
// =====================
router.get('/education_add', (req, res) => {
    res.render('admin/education_add.ejs');
});

router.post('/education_add_save', asyncHandler(async (req, res) => {
    const { edu_duration, edu_degree, edu_university } = req.body;

    await exe(
        'INSERT INTO education(edu_duration, edu_degree, edu_university) VALUES (?,?,?)',
        [edu_duration, edu_degree, edu_university]
    );

    res.redirect('/admin/education_add');
}));

router.get('/education_list', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM education');

    res.render('admin/education_list.ejs', {
        education: data
    });
}));

router.get('/education_edit/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM education WHERE eid=?',
        [req.params.id]
    );

    res.render('admin/education_edit.ejs', {
        education: data[0]
    });
}));

router.post('/education_update', asyncHandler(async (req, res) => {
    const { id, edu_duration, edu_degree, edu_university } = req.body;

    await exe(
        'UPDATE education SET edu_duration=?, edu_degree=?, edu_university=? WHERE eid=?',
        [edu_duration, edu_degree, edu_university, id]
    );

    res.redirect('/admin/education_list');
}));

router.get('/education_delete/:id', asyncHandler(async (req, res) => {
    await exe(
        'DELETE FROM education WHERE eid=?',
        [req.params.id]
    );

    res.redirect('/admin/education_list');
}));

// =====================
// SERVICES
// =====================
router.get('/service_add', (req, res) => {
    res.render('admin/service_add.ejs');
});

router.post('/service_add_save', asyncHandler(async (req, res) => {
    const { service_icon, service_title, service_description } = req.body;

    await exe(
        'INSERT INTO services(service_icon, service_title, service_description) VALUES (?,?,?)',
        [service_icon, service_title, service_description]
    );

    res.redirect('/admin/service_add');
}));

router.get('/service_list', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM services');

    res.render('admin/service_list.ejs', {
        services: data
    });
}));

router.get('/service_edit/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM services WHERE id=?',
        [req.params.id]
    );

    res.render('admin/service_edit.ejs', {
        service: data[0]
    });
}));

router.post('/service_update', asyncHandler(async (req, res) => {
    const { id, service_icon, service_title, service_description } = req.body;

    await exe(
        'UPDATE services SET service_icon=?, service_title=?, service_description=? WHERE id=?',
        [service_icon, service_title, service_description, id]
    );

    res.redirect('/admin/service_list');
}));

router.get('/service_delete/:id', asyncHandler(async (req, res) => {
    await exe(
        'DELETE FROM services WHERE id=?',
        [req.params.id]
    );

    res.redirect('/admin/service_list');
}));

// =====================
// PORTFOLIO
// =====================
router.get('/portfolio_add', (req, res) => {
    res.render('admin/portfolio_add.ejs');
});

router.post('/portfolio_add_save', asyncHandler(async (req, res) => {
    const { project_name, title } = req.body;

    let imgname = '';
    const img = getFile(req, 'image');

    if (img) imgname = await saveImage(img);

    await exe(
        'INSERT INTO porfolio(project_name, title, image) VALUES (?,?,?)',
        [project_name, title, imgname]
    );

    res.redirect('/admin/portfolio_add');
}));

router.get('/portfolio_list', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM porfolio');

    res.render('admin/portfolio_list.ejs', {
        portfolio: data
    });
}));

router.get('/portfolio_edit/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM porfolio WHERE id=?',
        [req.params.id]
    );

    res.render('admin/portfolio_edit.ejs', {
        portfolio: data[0]
    });
}));

router.post('/portfolio_update', asyncHandler(async (req, res) => {
    const { id, project_name, title, old_photo } = req.body;

    let imgname = old_photo || '';

    const img = getFile(req, 'photo') || getFile(req, 'image');

    if (img) {
        imgname = await saveImage(img);
        removeImage(old_photo);
    }

    await exe(
        'UPDATE porfolio SET project_name=?, title=?, image=? WHERE id=?',
        [project_name, title, imgname, id]
    );

    res.redirect('/admin/portfolio_list');
}));

router.get('/portfolio_delete/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM porfolio WHERE id=?',
        [req.params.id]
    );

    if (data.length > 0) {
        removeImage(data[0].image);

        await exe(
            'DELETE FROM porfolio WHERE id=?',
            [req.params.id]
        );
    }

    res.redirect('/admin/portfolio_list');
}));

// =====================
// TESTIMONIAL
// =====================
router.get('/testimonial_add', (req, res) => {
    res.render('admin/testimonial_add.ejs');
});

router.post('/testimonial_add_save', asyncHandler(async (req, res) => {
    const { client_name, client_position, testimonial_description } = req.body;

    let imgname = '';
    const img = getFile(req, 'photo');

    if (img) imgname = await saveImage(img);

    await exe(
        'INSERT INTO testimonial(client_name, client_position, testimonial_description, image) VALUES (?,?,?,?)',
        [client_name, client_position, testimonial_description, imgname]
    );

    res.redirect('/admin/testimonial_add');
}));

router.get('/testimonial_list', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM testimonial');

    res.render('admin/testimonial_list.ejs', {
        testimonial: data
    });
}));

router.get('/testimonial_edit/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM testimonial WHERE tid=?',
        [req.params.id]
    );

    res.render('admin/testimonial_edit.ejs', {
        testimonial: data[0]
    });
}));

router.post('/testimonial_update', asyncHandler(async (req, res) => {
    const {
        id, client_name, client_position,
        testimonial_description, old_photo
    } = req.body;

    let imgname = old_photo || '';
    const img = getFile(req, 'photo');

    if (img) {
        imgname = await saveImage(img);
        removeImage(old_photo);
    }

    await exe(
        'UPDATE testimonial SET client_name=?, client_position=?, testimonial_description=?, image=? WHERE tid=?',
        [client_name, client_position, testimonial_description, imgname, id]
    );

    res.redirect('/admin/testimonial_list');
}));

router.get('/testimonial_delete/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM testimonial WHERE tid=?',
        [req.params.id]
    );

    if (data.length > 0) {
        removeImage(data[0].image);

        await exe(
            'DELETE FROM testimonial WHERE tid=?',
            [req.params.id]
        );
    }

    res.redirect('/admin/testimonial_list');
}));

// =====================
// SETTINGS
// =====================
router.get('/setting', asyncHandler(async (req, res) => {
    const contact = await exe('SELECT * FROM contact');
    const social = await exe('SELECT * FROM social');

    res.render('admin/settings.ejs', {
        data: contact[0],
        data1: social[0]
    });
}));

router.post('/contact_save', asyncHandler(async (req, res) => {
    const { email, phone, address, map, old_logo } = req.body;

    let imgname = old_logo || '';
    const img = getFile(req, 'logo');

    if (img) {
        imgname = await saveImage(img);
        removeImage(old_logo);
    }

    await exe(
        'UPDATE contact SET email=?, phone=?, address=?, map=?, logo=? WHERE cid=1',
        [email, phone, address, map, imgname]
    );

    res.redirect('/admin/setting');
}));

router.post('/social_save', asyncHandler(async (req, res) => {
    const { facebook, twitter, instagram, linkedin, github, youtube } = req.body;

    await exe(
        'UPDATE social SET facebook=?, twitter=?, instagram=?, linkedin=?, github=?, youtube=? WHERE sid=1',
        [facebook, twitter, instagram, linkedin, github, youtube]
    );

    res.redirect('/admin/setting');
}));

// =====================
// HERO
// =====================
router.get('/hero_edit', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM hero');

    res.render('admin/hero_edit.ejs', {
        hero: data[0]
    });
}));

router.post('/hero_save', asyncHandler(async (req, res) => {
    const { name, Position, experience_disc, old_photo } = req.body;

    let imgname = old_photo || '';
    const img = getFile(req, 'photo');

    if (img) {
        imgname = await saveImage(img);
        removeImage(old_photo);
    }

    await exe(
        'UPDATE hero SET name=?, Position=?, experience_disc=?, Photo=? WHERE id=1',
        [name, Position, experience_disc, imgname]
    );

    res.redirect('/admin/hero_edit');
}));

// =====================
// ABOUT
// =====================
router.get('/about_edit', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM about');

    res.render('admin/about_edit.ejs', {
        about: data[0]
    });
}));

router.post('/about_save', asyncHandler(async (req, res) => {
    const {
        name, position, expirience_dicription,
        how_year_expirence, your_expirence, email,
        location, freelance, Project_complete,
        happy_client, Awards_won, year_of_expirence,
        old_photo
    } = req.body;

    let imgname = old_photo || '';
    const img = getFile(req, 'photo');

    if (img) {
        imgname = await saveImage(img);
        removeImage(old_photo);
    }

    await exe(
        `UPDATE about SET name=?, position=?, expirience_dicription=?,
        how_year_expirence=?, your_expirence=?, email=?, location=?,
        freelance=?, Project_complete=?, happy_client=?, Awards_won=?,
        year_of_expirence=?, Image=? WHERE id=1`,
        [
            name, position, expirience_dicription,
            how_year_expirence, your_expirence, email,
            location, freelance, Project_complete,
            happy_client, Awards_won, year_of_expirence,
            imgname
        ]
    );

    res.redirect('/admin/about_edit');
}));

// =====================
// BLOG
// =====================
router.get('/blog_add', (req, res) => {
    res.render('admin/blog_add.ejs');
});

router.post('/blog_add_save', asyncHandler(async (req, res) => {
    const { post_name, post_date, post_discription, post_readmore } = req.body;

    let imgname = '';
    const img = getFile(req, 'photo');

    if (img) imgname = await saveImage(img);

    await exe(
        'INSERT INTO blog(post_name, post_date, post_discription, post_readmore, Image) VALUES (?,?,?,?,?)',
        [post_name, post_date, post_discription, post_readmore, imgname]
    );

    res.redirect('/admin/blog_list');
}));

router.get('/blog_list', asyncHandler(async (req, res) => {
    const data = await exe('SELECT * FROM blog');

    res.render('admin/blog_list.ejs', {
        blog: data
    });
}));

router.get('/blog_edit/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM blog WHERE id=?',
        [req.params.id]
    );

    res.render('admin/blog_edit.ejs', {
        blog: data[0]
    });
}));

router.post('/blog_update', asyncHandler(async (req, res) => {
    const {
        id, post_name, post_date,
        post_discription, post_readmore, old_photo
    } = req.body;

    let imgname = old_photo || '';
    const img = getFile(req, 'photo');

    if (img) {
        imgname = await saveImage(img);
        removeImage(old_photo);
    }

    await exe(
        'UPDATE blog SET post_name=?, post_date=?, post_discription=?, post_readmore=?, Image=? WHERE id=?',
        [post_name, post_date, post_discription, post_readmore, imgname, id]
    );

    res.redirect('/admin/blog_list');
}));

router.get('/blog_delete/:id', asyncHandler(async (req, res) => {
    const data = await exe(
        'SELECT * FROM blog WHERE id=?',
        [req.params.id]
    );

    if (data.length > 0) {
        removeImage(data[0].Image);

        await exe(
            'DELETE FROM blog WHERE id=?',
            [req.params.id]
        );
    }

    res.redirect('/admin/blog_list');
}));

// =====================
// ENQUIRIES
// =====================

// Pending
router.get('/pending_enq', asyncHandler(async (req, res) => {
    const data = await exe(
        "SELECT * FROM contact_save WHERE cstatus='pending'"
    );

    res.render('admin/pending_enq.ejs', { data });
}));

router.get('/pending_confirm/:id', asyncHandler(async (req, res) => {
    await exe(
        "UPDATE contact_save SET cstatus='confirm' WHERE cid=?",
        [req.params.id]
    );

    res.redirect('/admin/pending_enq');
}));

router.get('/pending_reject/:id', asyncHandler(async (req, res) => {
    await exe(
        "UPDATE contact_save SET cstatus='reject' WHERE cid=?",
        [req.params.id]
    );

    res.redirect('/admin/pending_enq');
}));

// Confirm
router.get('/confirm_enq', asyncHandler(async (req, res) => {
    const data = await exe(
        "SELECT * FROM contact_save WHERE cstatus='confirm'"
    );

    res.render('admin/confirm_enq.ejs', { data });
}));

router.get('/confirm_reject/:id', asyncHandler(async (req, res) => {
    await exe(
        "UPDATE contact_save SET cstatus='reject' WHERE cid=?",
        [req.params.id]
    );

    res.redirect('/admin/confirm_enq');
}));

// Reject
router.get('/reject_enq', asyncHandler(async (req, res) => {
    const data = await exe(
        "SELECT * FROM contact_save WHERE cstatus='reject'"
    );

    res.render('admin/reject_enq.ejs', { data });
}));

router.get('/reject_confirm/:id', asyncHandler(async (req, res) => {
    await exe(
        "UPDATE contact_save SET cstatus='confirm' WHERE cid=?",
        [req.params.id]
    );

    res.redirect('/admin/reject_enq');
}));

// =====================
// ERROR HANDLER
// =====================
router.use((err, req, res, next) => {
    console.log('Admin Route Error:', err.message);

    if (res.headersSent) return next(err);

    res.status(500).send('Admin Error: ' + err.message);
});

// =====================
// EXPORT
// =====================
module.exports = router;