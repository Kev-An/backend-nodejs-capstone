/*jshint esversion: 8 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoLogger = require('./logger');
const searchRoutes = require("./routes/searchRoutes");
const authRoutes = require("./routes/authRoutes");

// ✅ Step 1: Import secondChanceItemsRoutes
const secondChanceItemsRoutes = require("./routes/secondChanceItemsRoutes");

const connectToDatabase = require('./models/db');
const { loadData } = require("./util/import-mongo/index");

const app = express();
app.use("*", cors());
const port = 3060;

// Connect to MongoDB; we just do this one time
connectToDatabase()
    .then(() => {
        pinoLogger.info('Connected to DB');
    })
    .catch((e) => console.error('Failed to connect to DB', e));

app.use(express.json());

// ✅ Route Setup

// Auth Routes - already done
app.use("/api/auth", authRoutes); // AuthRoutes Step 2

// ✅ Items API Task 2: Use secondChanceItemsRoutes
app.use('/api/secondchance', secondChanceItemsRoutes);

// ✅ Search API Task 2: already done
app.use('/api/secondchance/search', searchRoutes);

const pinoHttp = require('pino-http');
const logger = require('./logger');
app.use(pinoHttp({ logger }));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

app.get("/", (req, res) => {
    res.send("Inside the server");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
