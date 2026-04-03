const User = require('../models/User');
const Record = require('../models/Record');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('Database already seeded, skipping...');
            return;
        }

        console.log('Seeding Database with Dummy Data...');

        // Create Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin'
        });

        const analyst = await User.create({
            name: 'Analyst User',
            email: 'analyst@test.com',
            password: hashedPassword,
            role: 'analyst'
        });

        const viewer = await User.create({
            name: 'Viewer User',
            email: 'viewer@test.com',
            password: hashedPassword,
            role: 'viewer'
        });

        console.log('Users created: admin@test.com, analyst@test.com, viewer@test.com (Password: password123)');

        // Create Records
        const categories = ['Salary', 'Freelance', 'Food', 'Rent', 'Utilities', 'Entertainment', 'Transport'];
        const records = [];

        for (let i = 0; i < 35; i++) {
            const isIncome = Math.random() > 0.6;
            const type = isIncome ? 'income' : 'expense';
            const category = isIncome ? categories[Math.floor(Math.random() * 2)] : categories[Math.floor(Math.random() * 5) + 2];
            const amount = isIncome ? Math.floor(Math.random() * 5000) + 500 : Math.floor(Math.random() * 200) + 10;

            // Random date within last 3 months
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 90));

            records.push({
                userId: admin._id,
                amount,
                type,
                category,
                date,
                notes: `Seed data record ${i}`
            });
        }

        await Record.insertMany(records);
        console.log(`Seeded ${records.length} financial records.`);

    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

module.exports = seedDatabase;
