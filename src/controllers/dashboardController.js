const Record = require('../models/Record');

exports.getSummary = async (req, res) => {
    try {
        const result = await Record.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        let totalIncome = 0;
        let totalExpense = 0;

        result.forEach(item => {
            if (item._id === 'income') totalIncome = item.totalAmount;
            if (item._id === 'expense') totalExpense = item.totalAmount;
        });

        res.json({
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCategoryBreakdown = async (req, res) => {
    try {
        const { type } = req.query; // 'income' or 'expense'
        const matchStage = { isDeleted: false };
        if (type) matchStage.type = type;

        const result = await Record.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTrends = async (req, res) => {
    try {
        // Group by month
        const result = await Record.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        type: "$type"
                    },
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRecent = async (req, res) => {
    try {
        const records = await Record.find({ isDeleted: false })
            .sort({ date: -1 })
            .limit(5)
            .populate('userId', 'name email');
        
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
