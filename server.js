const express = require('express');
const app = express();

const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Authorization');
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;
const secretKey = 'My super secret key';

let users = [
    {
        id: 1,
        username: 'carlos',
        password: '123'
    },
    {
        id: 2,
        username: 'john',
        password: '987'
    }
];

// Custom middleware for JWT verification
const jwtVerify = (req, res, next) => {
    // Extract token from Authorization header
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (token) {
        // Verify token
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                // Token verification failed
                return res.status(401).json({ success: false, err: 'Failed to authenticate token.' });
            } else {
                // Token verified, attach user information to request object
                req.decoded = decoded;
                next(); // Move to the next middleware
            }
        });
    } else {
        // No token provided, return error
        return res.status(403).json({ success: false, err: 'No token provided.' });
    }
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    for (let user of users) {
        if (username == user.username && password == user.password) {
            let token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '7d' });
            res.json({
                success: true,
                err: null,
                token
            });
            return; // Exit the loop once user is found
        }
    }

    // If loop finishes without finding a user, return unauthorized
    res.status(401).json({
        success: false,
        token: null,
        err: 'Username or Password is incorrect'
    });
});

// Routes that require authentication
app.get('/api/dashboard', jwtVerify, (req, res) => {
    console.log(req);
    res.json({
        success: true,
        myContent: 'Secret content that only logged in people can see.'
    });
});

app.get('/api/prices', jwtVerify, (req, res) => {
    console.log(req);
    res.json({
        success: true,
        myContent: 'This is the price $3.99'
    });
});

// Route for serving index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            success: false,
            officialError: err,
            err: 'Username or Password is incorrect 2'
        });
    } else {
        next(err);
    }
});

app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});
