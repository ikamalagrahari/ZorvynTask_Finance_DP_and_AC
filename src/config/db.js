const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;
        
        // Vercel / Production environments require a real MongoDB cluster
        // We only use the Memory Server locally for easy testing
        if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            console.log("Starting Local MongoDB Memory Server...");
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }

        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to DB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
