const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;
        
        console.log("Checking MONGODB_URI presence:", !!uri);
        if (uri) {
            const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
            console.log("Attempting to connect to:", maskedUri);
        }

        if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            console.log("Starting Local MongoDB Memory Server...");
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // 5 seconds timeout
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("DATABASE CONNECTION ERROR:", error.message);
    }
};

module.exports = connectDB;
