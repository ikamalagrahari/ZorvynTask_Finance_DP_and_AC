const express = require('express');
const router = express.Router();
const {
    getSummary,
    getCategoryBreakdown,
    getTrends,
    getRecent
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);
// Dashboard accessible to analyst and admin
router.use(authorize('admin', 'analyst'));

router.get('/summary', getSummary);
router.get('/category', getCategoryBreakdown);
router.get('/trends', getTrends);
router.get('/recent', getRecent);

module.exports = router;
