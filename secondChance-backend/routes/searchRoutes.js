const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for items
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(process.env.MONGO_COLLECTION); // ✅ use correct collection

        let query = {};

        if (req.query.name && req.query.name.trim() !== '') {
            query.name = { $regex: req.query.name, $options: "i" };
        }

        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.condition) {
            query.condition = req.query.condition;
        }
        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years) };
        }

        const results = await collection.find(query).toArray();
        res.json(results);
    } catch (e) {
        console.error("❌ Error in search route:", e);
        res.status(500).json({ error: 'Internal Server Error', message: e.message });
    }
});

module.exports = router;
