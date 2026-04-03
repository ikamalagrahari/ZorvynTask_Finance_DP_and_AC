const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(async () => {
    // Only run seeder automatically if NOT in production (Serverless Vercel)
    if (process.env.NODE_ENV !== 'production') {
        const seedDatabase = require('./utils/seed');
        await seedDatabase();
    }
});

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static frontend UI
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Basic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Only listen locally, Vercel will process requests serverlessly
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
