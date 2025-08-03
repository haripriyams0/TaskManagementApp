const express = require('express');
const router = express.Router();
const {
  login,
  registerAdmin,
  updateAdmin
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerAdmin); // only if no admin exists
router.post('/login', login);
router.put('/update', protect, updateAdmin);

module.exports = router;
// This module defines routes for user authentication, including login, registration, and updating user information.
// It uses the Express framework to handle HTTP requests and responses. 