const express = require('express');
const router = express.Router();
const { addAgent, getAgents, agentLogin} = require('../controllers/agentController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/', protect, requireRole('admin'), addAgent);
router.get('/', protect, requireRole('admin'), getAgents);
router.post('/login', agentLogin);

module.exports = router;
// This module defines routes for agent management, including adding agents, retrieving agents, and agent login.
// It uses the Express framework to handle HTTP requests and responses, and includes middleware for authentication and authorization.
