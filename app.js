require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
//const uri = process.env.MONGO_DB_URL;
const bodyParser = require('body-parser');
const mainRoutes = require('./routes/mainRoutes');

mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' } // set to true if using https
}));

// Logging middleware for debugging
app.use((req, res, next) => {
    next();
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('views')); 
app.use('/', mainRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.set('view engine', 'ejs');

//for hosting static files
app.use(express.static('public'));