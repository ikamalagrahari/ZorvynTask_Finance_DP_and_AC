const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;
        
        // Use in-memory MongoDB for easy testing and running locally without setup
        console.log("Starting MongoDB Memory Server...");
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();

        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected (Memory-Server): ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to DB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
