const Record = require('../models/Record');
const Joi = require('joi');

const recordSchema = Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('income', 'expense').required(),
    category: Joi.string().required(),
    date: Joi.date().optional(),
    notes: Joi.string().allow('').optional()
});

const updateRecordSchema = Joi.object({
    amount: Joi.number().positive(),
    type: Joi.string().valid('income', 'expense'),
    category: Joi.string(),
    date: Joi.date(),
    notes: Joi.string().allow('')
});

exports.createRecord = async (req, res) => {
    try {
        const { error } = recordSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const record = await Record.create({
            ...req.body,
            userId: req.user._id
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRecords = async (req, res) => {
    try {
        const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;
        let query = { isDeleted: false };
        
        if (type) query.type = type;
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const records = await Record.find(query)
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Record.countDocuments(query);

        res.json({
            records,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRecordById = async (req, res) => {
    try {
        const record = await Record.findOne({ _id: req.params.id, isDeleted: false })
            .populate('userId', 'name email');
        
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateRecord = async (req, res) => {
    try {
        const { error } = updateRecordSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const record = await Record.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            req.body,
            { new: true }
        );

        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteRecord = async (req, res) => {
    try {
        const record = await Record.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
