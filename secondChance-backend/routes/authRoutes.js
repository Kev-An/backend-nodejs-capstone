const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../logger")
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || "your_fallback_secret";

router.post("/register", async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("users");

        const { email, firstName, lastName, password } = req.body;

        const existingEmail = await collection.findOne({ email });

        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

        const newUser = await collection.insertOne({
            email,
            firstName,
            lastName,
            password: hash,
            createdAt: new Date(),
        });

        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('User registered successfully');

        res.json({ authtoken, email });
    } catch (error) {
        logger.error('Error during registration:', error);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;
