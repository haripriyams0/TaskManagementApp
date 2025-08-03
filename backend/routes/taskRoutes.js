const express = require('express');
const router = express.Router();
const { 
    getAllTasks, 
    getAgentTasks, 
    updateTaskStatus,
    draftUpload,
    confirmDraft,
    getMyTasks,
    reassignTask,
    finalizeAssignments,
    getTasks
} = require('../controllers/taskController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Admin routes
router.get('/all', protect, requireRole('admin'), getAllTasks);
router.post('/draft-upload', protect, requireRole('admin'), upload.single('file'), draftUpload);
router.post('/confirm-draft', protect, requireRole('admin'), confirmDraft);
router.patch('/task/:id/assign', protect, requireRole('admin'), reassignTask);
router.patch('/task/finalize', protect, requireRole('admin'), finalizeAssignments);
router.patch('/admin/:id/status', protect, requireRole('admin'), updateTaskStatus); // Admin can update any task status

// Agent routes
router.get('/my', protect, requireRole('agent'), getAgentTasks);
router.get('/my-tasks', protect, requireRole('agent'), getMyTasks);
router.patch('/agent/:id/status', protect, requireRole('agent'), updateTaskStatus); // Agent can update their own task status

// General routes (admin and agent)
router.get('/task', protect, getTasks);

module.exports = router;
// This module defines routes for task management, including retrieving all tasks, agent-specific tasks, and updating task status.
// It uses the Express framework to handle HTTP requests and responses, and includes middleware for authentication and authorization.

