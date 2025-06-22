const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        // Step 2: Task 1 - Retrieve the database connection from db.js and store in db
        const db = await connectToDatabase();

        // Step 2: Task 2 - Use the collection() method to retrieve the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Step 2: Task 3 - Fetch all items using find(). Chain with toArray() to convert to a JSON array
        const secondChanceItems = await collection.find({}).toArray();

        // Step 2: Task 4 - Return the secondChanceItems using res.json()
        res.json(secondChanceItems);
    } catch (e) {
        logger.console.error('oops something went wrong', e);
        next(e);
    }
});


// Add a new item
// Add a new item
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        // Task 1: Retrieve the database connection from db.js
        const db = await connectToDatabase();

        // Task 2: Use the collection() method to retrieve the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Task 3: Create a new secondChanceItem from the request body
        const newItem = req.body;

        // Task 4: Get the last id, increment by 1, and set it to the new secondChanceItem
        const lastItem = await collection.find().sort({ id: -1 }).limit(1).toArray();
        const newId = lastItem.length ? lastItem[0].id + 1 : 1;
        newItem.id = newId;

        // Task 5: Set the current date in the new item
        newItem.date = new Date();

        // Task 6: Add the secondChanceItem to the database
        const result = await collection.insertOne(newItem);
        if (req.file) {
            newItem.image = req.file.filename;
            await collection.updateOne({ _id: result.insertedId }, { $set: { image: req.file.filename } });
        }

        res.status(201).json(result.ops ? result.ops[0] : newItem);
    } catch (e) {
        next(e);
    }
});


// Get a single secondChanceItem by ID
// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        // Task 1: Retrieve the database connection from db.js and store in db
        const db = await connectToDatabase();

        // Task 2: Use the collection() method to retrieve the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Task 3: Find a specific secondChanceItem by its ID
        const id = parseInt(req.params.id); // assuming `id` is a number
        const secondChanceItem = await collection.findOne({ id: id });

        // Task 4: Return the item as JSON, or error if not found
        if (!secondChanceItem) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});


// Update and existing item
router.put('/:id', async (req, res, next) => {
    try {
        // Task 1: Retrieve the database connection
        const db = await connectToDatabase();

        // Task 2: Use the collection() method to retrieve secondChanceItems
        const collection = db.collection("secondChanceItems");

        // Task 3: Check if the item exists
        const id = parseInt(req.params.id); // assuming numeric ID
        const existingItem = await collection.findOne({ id: id });

        if (!existingItem) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Task 4: Update attributes
        const { category, condition, age_days, description } = req.body;
        const age_years = parseFloat((age_days / 365).toFixed(1));
        const updatedAt = new Date();

        const updateData = {
            category,
            condition,
            age_days,
            age_years,
            description,
            updatedAt,
        };

        await collection.updateOne({ id: id }, { $set: updateData });

        // Task 5: Send confirmation
        res.json({ message: "Item updated successfully", updatedItem: updateData });
    } catch (e) {
        next(e);
    }
});


// Delete an existing item
router.delete('/:id', async (req, res, next) => {
    try {
        // Task 1: Retrieve the database connection
        const db = await connectToDatabase();

        // Task 2: Use the collection() method to retrieve secondChanceItems
        const collection = db.collection("secondChanceItems");

        // Task 3: Find a specific secondChanceItem by ID
        const id = parseInt(req.params.id); // assuming id is a number
        const existingItem = await collection.findOne({ id: id });

        if (!existingItem) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Task 4: Delete the object and send a confirmation message
        await collection.deleteOne({ id: id });

        res.json({ message: "Item deleted successfully" });
    } catch (e) {
        next(e);
    }
});


module.exports = router;
