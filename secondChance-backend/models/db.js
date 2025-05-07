require('dotenv').config();
const { MongoClient } = require('mongodb');

let dbInstance = null;
const url = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB;

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    const client = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await client.connect();
    console.log('✅ Connected to MongoDB');

    dbInstance = client.db(dbName);
    return dbInstance;
}

module.exports = connectToDatabase;
