// routes/mainRoutes.js
const express = require('express');
const router = express.Router();
const brainModel = require('../models/brainModel');
const Post = require('../models/Post'); 
const User = require('../models/User');
const bcrypt = require('bcrypt');

router.get('/', async (req, res) => {
    const user = await User.findById(req.session.userId);
    try {
        const posts = await Post.find().sort('creationDate'); // Fetch all posts
        res.render('index', { posts: posts }); // Render index view with posts data
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/predict', async (req, res) => {
    const { month, moneyNeeded, promoted, deadline, coverage  } = req.body;

    // Convert the deadline string to a date object
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    const timeDiff = deadlineDate.getTime() - currentDate.getTime();
    // Calculate the number of days until the deadline
    const daysUntilDeadline = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Preprocess these inputs like your training data
    const inputData = brainModel.preprocessInput({
        month, 
        moneyNeeded, 
        promoted: promoted === 'true' ? 1 : 0, 
        daysUntilDeadline,
        coverage
    });


    const prediction = brainModel.predictDaysRequired(inputData);
    console.log(prediction[0]);
    res.send(`${(prediction[0] * 30).toFixed(2)}`); 
});


router.post('/createPost', isAuthenticated,  async (req, res) => {
    
    if (!req.session.userId) {
        return res.redirect('/signin');
    }

    try {
        const { name, description, category, moneyNeeded, promoted, coverage, deadline, predictedDeadline, monobankUrl, privatUrl, userId } = req.body;
        const newPost = new Post({
            name,
            description,
            category,
            moneyNeeded,
            promoted: !!promoted, // Convert to boolean: true if 'promoted' exists in the request body
            coverage,
            deadline,
            predictedDeadline,
            monobankUrl,
            privatUrl,
            user: userId, // Linking the post to the user
            creationDate: new Date(),
            month: new Date().getMonth()
        });

        await newPost.save();
        res.redirect('/account');
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});


// Route to show the edit form
router.get('/edit/:id',  async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.render('edit', { post: post }); // Render an edit view with the post data
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to handle the edit form submission
router.post('/update/:id', async (req, res) => {
    try {
        const { name, description, category, moneyNeeded, promoted, deadline, monobankUrl, privatUrl } = req.body;

        await Post.findByIdAndUpdate(req.params.id, {
            name,
            description,
            category,
            moneyNeeded,
            promoted: promoted === 'true', // Convert to boolean
            deadline,
            monobankUrl,
            privatUrl
        });

        res.redirect('/'); // Redirect to the homepage or any other page
    } catch (error) {
        res.status(500).send(error.message);
    }
});


// Route to handle post deletion
router.post('/delete/:id',  async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Admin post status route
router.post('/updateStatus/:id',  async (req, res) => {
    const postId = req.params.id;
    const newStatus = req.body.status;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        if (newStatus === 'Closed') {
            const now = new Date();
            const daysSpent = Math.ceil((now - post.creationDate) / (1000 * 60 * 60 * 24));
            await Post.findByIdAndUpdate(postId, { status: newStatus, daysSpent: daysSpent });
        } else if (newStatus === 'Verified') {
            await Post.findByIdAndUpdate(postId, { status: newStatus, daysSpent: null });
        } else {
            await Post.findByIdAndUpdate(postId, { status: newStatus });
        }

        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

// Post form
router.get('/postForm', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/signin'); // Redirect to signin if not logged in
    }

    const user = await User.findById(req.session.userId);
    res.render('postForm', {user: user});
});


// Sign-up route
router.get('/signup', (req, res) => {
    res.render('signup'); // Render the signin.ejs view
});


router.post('/signup', async (req, res) => {
    try {
        const { name, surname, email, password } = req.body;
        let user = await User.findOne({ email: email });
        if (user) {
            return res.status(400).send('User already exists');
        }

        user = new User({ name, surname, email, password });
        await user.save();

        res.redirect('/signin');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Sign-in route

router.get('/signin', (req, res) => {
    res.render('signin'); // Render the signin.ejs view
});

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).send('Invalid email');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid password');
        }

        // Set user session
        req.session.userId = user._id.valueOf();
        
        // Redirect to the admin page if the user is an admin
        if (user.role === 'admin') {
            res.redirect('/admin');
        } else {
            // Redirect to the regular user account page if not an admin
            res.redirect('/account');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Account route

router.get('/account', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/signin'); // Redirect to signin if not logged in
    }

    try {
        const user = await User.findById(req.session.userId);
        const posts = await Post.find({ user: req.session.userId }).sort('creationDate'); // Fetch posts by this user
        if (!user) {
            // Handle case where user is not found
            res.status(404).send("User not found");
        } else {
            res.render('account', { user: user, posts: posts });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred");
    }
});

//Admin route
router.get('/admin',  isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const posts = await Post.find().sort('creationDate'); 
        res.render('admin', { posts: posts, user: user }); // Render an admin view with all posts
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});



router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            // Handle error
            res.status(500).send("Error logging out");
        } else {
            res.redirect('/signin');
        }
    });
});

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/signin');
}

//Post page
router.get('/post/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send('Post not found');
        }

        res.render('post', { post: post });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

async function isAdmin(req, res, next) {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user && user.role === 'admin') {
                next();
            } else {
                res.redirect('/account');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("An error occurred");
        }
    } else {
        res.redirect('/signin');
    }
}



module.exports = router;