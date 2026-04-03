const express = require('express');
const router = express.Router();
const {
    createRecord,
    getRecords,
    getRecordById,
    updateRecord,
    deleteRecord
} = require('../controllers/recordController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.route('/')
    .post(authorize('admin'), createRecord)
    .get(authorize('admin', 'analyst', 'viewer'), getRecords);

router.route('/:id')
    .get(authorize('admin', 'analyst', 'viewer'), getRecordById)
    .patch(authorize('admin'), updateRecord)
    .delete(authorize('admin'), deleteRecord);

module.exports = router;
