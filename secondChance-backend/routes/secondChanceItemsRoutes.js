const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../models/db');
const logger = require('../logger');

const router = express.Router();

// Define the upload directory path
const directoryPath = 'public/images';

// Ensure the upload directory exists
if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

/**
 * GET / - Get all secondChanceItems
 */
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error('Oops, something went wrong', e);
        next(e);
    }
});

/**
 * POST / - Add a new item
 */
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const { title, description, price } = req.body;
        const imagePath = req.file ? path.join('/images', req.file.originalname) : null;

        const newItem = {
            title,
            description,
            price: parseFloat(price),
            imagePath,
            createdAt: new Date()
        };

        const result = await collection.insertOne(newItem);
        res.status(201).json(result.ops ? result.ops[0] : newItem); // fallback for newer MongoDB drivers
    } catch (e) {
        next(e);
    }
});

/**
 * GET /:id - Get item by ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const item = await collection.findOne({ _id: new ObjectId(id) });

        if (!item) return res.status(404).json({ message: 'Item not found' });

        res.json(item);
    } catch (e) {
        next(e);
    }
});

/**
 * PUT /:id - Update an existing item
 */
router.put('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const { title, description, price } = req.body;

        const updatedItem = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { title, description, price: parseFloat(price) } },
            { returnDocument: 'after' }
        );

        if (!updatedItem.value) return res.status(404).json({ message: 'Item not found' });

        res.json(updatedItem.value);
    } catch (e) {
        next(e);
    }
});

/**
 * DELETE /:id - Delete an item
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const deletedItem = await collection.findOneAndDelete({ _id: new ObjectId(id) });

        if (!deletedItem.value) return res.status(404).json({ message: 'Item not found' });

        res.json({ message: 'Item deleted successfully' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
