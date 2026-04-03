const express = require('express');
const router = express.Router();
const { getUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);
router.use(authorize('admin')); // All user routes require admin

router.get('/', getUsers);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
