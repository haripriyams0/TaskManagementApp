# Chapter 8: The Task Management Empire
*Where our hero builds the CRUD system that makes admins feel like digital overlords*

---

## The CRUD Kingdom

With file uploads conquered, I faced the ultimate challenge: building a comprehensive task management system. This wasn't just about displaying data - this was about creating, reading, updating, and deleting tasks with the precision of a Swiss watch and the power of a bulldozer.

The requirements were clear but daunting:
- ✅ View all tasks with filtering and search
- ✅ Create individual tasks manually
- ✅ Edit task details and reassign agents
- ✅ Update task status (the infamous bug we'd later fix!)
- ✅ Delete tasks (with confirmation, because accidents happen)
- ✅ Bulk operations for efficiency
- ✅ Real-time updates for multiple users

*Narrator voice: Our hero was about to build the Empire State Building of task management.*

## The Backend Task Controllers

### The Task Model (Enhanced)
First, I enhanced the Task model with better validation and methods:

```javascript
// models/Task.js (Enhanced version)
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(phone) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid phone number'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'in-progress', 'completed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: '{VALUE} is not a valid priority'
    },
    default: 'medium'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ assignedAgent: 1 });
taskSchema.index({ email: 1 });
taskSchema.index({ priority: 1 });

// Virtual for full name
taskSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

// Middleware to update completedAt when status changes to completed
taskSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate();
  if (update.status === 'completed' && !update.completedAt) {
    update.completedAt = new Date();
  } else if (update.status !== 'completed') {
    update.completedAt = null;
  }
});

module.exports = mongoose.model('Task', taskSchema);
```

**The Mongoose Middleware Magic**: Learning about pre-save and pre-update hooks was like discovering automatic helpers. When a task is marked complete, it automatically timestamps itself!

### The Comprehensive Task Controller
```javascript
// controllers/taskController.js
const Task = require('../models/Task');
const Agent = require('../models/Agent');
const User = require('../models/User');

// Get all tasks with filtering, sorting, and pagination
const getAllTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedAgent,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (assignedAgent && assignedAgent !== 'all') {
      filter.assignedAgent = assignedAgent === 'unassigned' ? null : assignedAgent;
    }
    
    // Search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const tasks = await Task.find(filter)
      .populate('assignedAgent', 'name email specialization')
      .populate('assignedBy', 'email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalTasks = await Task.countDocuments(filter);
    const totalPages = Math.ceil(totalTasks / limitNum);

    // Calculate stats
    const stats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      pending: 0,
      'in-progress': 0,
      completed: 0
    };

    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.json({
      message: 'Tasks retrieved successfully',
      tasks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalTasks,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      stats: statusStats
    });

    console.log(`📋 Retrieved ${tasks.length} tasks (page ${pageNum})`);

  } catch (error) {
    console.error('💥 Error getting tasks:', error);
    res.status(500).json({ message: 'Failed to retrieve tasks' });
  }
};

// Get tasks assigned to the current agent
const getMyTasks = async (req, res) => {
  try {
    // Find agent by user email
    const agent = await Agent.findOne({ email: req.user.email });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent profile not found' });
    }

    const tasks = await Task.find({ assignedAgent: agent._id })
      .populate('assignedBy', 'email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      message: 'Agent tasks retrieved successfully',
      tasks,
      agentInfo: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        specialization: agent.specialization
      }
    });

    console.log(`👤 Retrieved ${tasks.length} tasks for agent ${agent.name}`);

  } catch (error) {
    console.error('💥 Error getting agent tasks:', error);
    res.status(500).json({ message: 'Failed to retrieve agent tasks' });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      priority = 'medium',
      assignedAgent,
      notes,
      dueDate
    } = req.body;

    // Check if task with this email already exists
    const existingTask = await Task.findOne({ email });
    if (existingTask) {
      return res.status(400).json({ 
        message: 'A task with this email already exists' 
      });
    }

    // Validate assigned agent if provided
    if (assignedAgent) {
      const agent = await Agent.findById(assignedAgent);
      if (!agent || !agent.isActive) {
        return res.status(400).json({ 
          message: 'Invalid or inactive agent selected' 
        });
      }
    }

    // Create new task
    const task = new Task({
      firstName,
      lastName,
      email,
      phone,
      priority,
      assignedAgent: assignedAgent || null,
      assignedBy: req.user.id,
      notes,
      dueDate: dueDate ? new Date(dueDate) : null
    });

    await task.save();

    // Populate references for response
    await task.populate('assignedAgent', 'name email specialization');
    await task.populate('assignedBy', 'email');

    // Update agent task count if assigned
    if (assignedAgent) {
      await Agent.findByIdAndUpdate(
        assignedAgent,
        { $inc: { tasksAssigned: 1 } }
      );
    }

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

    console.log(`✨ Created new task for ${firstName} ${lastName}`);

  } catch (error) {
    console.error('💥 Error creating task:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the current task
    const currentTask = await Task.findById(id);
    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Validate assigned agent if being changed
    if (updateData.assignedAgent && updateData.assignedAgent !== currentTask.assignedAgent?.toString()) {
      const agent = await Agent.findById(updateData.assignedAgent);
      if (!agent || !agent.isActive) {
        return res.status(400).json({ 
          message: 'Invalid or inactive agent selected' 
        });
      }
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('assignedAgent', 'name email specialization')
     .populate('assignedBy', 'email');

    // Update agent task counts if assignment changed
    const oldAgentId = currentTask.assignedAgent?.toString();
    const newAgentId = updateData.assignedAgent;

    if (oldAgentId !== newAgentId) {
      // Decrease old agent's count
      if (oldAgentId) {
        await Agent.findByIdAndUpdate(
          oldAgentId,
          { $inc: { tasksAssigned: -1 } }
        );
      }
      
      // Increase new agent's count
      if (newAgentId) {
        await Agent.findByIdAndUpdate(
          newAgentId,
          { $inc: { tasksAssigned: 1 } }
        );
      }
    }

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });

    console.log(`🔄 Updated task ${id}`);

  } catch (error) {
    console.error('💥 Error updating task:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// Update task status (separate endpoint for status-only updates)
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Check if user has permission to update this task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Admin can update any task, agent can only update their own
    if (req.user.role === 'agent') {
      const agent = await Agent.findOne({ email: req.user.email });
      if (!agent || task.assignedAgent?.toString() !== agent._id.toString()) {
        return res.status(403).json({ 
          message: 'You can only update tasks assigned to you' 
        });
      }
    }

    // Update status
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { 
        status,
        completedAt: status === 'completed' ? new Date() : null
      },
      { new: true }
    ).populate('assignedAgent', 'name email specialization');

    res.json({
      message: 'Task status updated successfully',
      task: updatedTask
    });

    console.log(`🔄 Task ${id} status updated to ${status}`);

  } catch (error) {
    console.error('💥 Error updating task status:', error);
    res.status(500).json({ message: 'Failed to update task status' });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update agent task count if task was assigned
    if (task.assignedAgent) {
      await Agent.findByIdAndUpdate(
        task.assignedAgent,
        { $inc: { tasksAssigned: -1 } }
      );
    }

    await Task.findByIdAndDelete(id);

    res.json({
      message: 'Task deleted successfully',
      deletedTask: {
        id: task._id,
        fullName: `${task.firstName} ${task.lastName}`,
        email: task.email
      }
    });

    console.log(`🗑️ Deleted task ${id}`);

  } catch (error) {
    console.error('💥 Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// Bulk operations
const bulkUpdateTasks = async (req, res) => {
  try {
    const { taskIds, operation, data } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'Task IDs are required' });
    }

    let result;

    switch (operation) {
      case 'updateStatus':
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { 
            status: data.status,
            completedAt: data.status === 'completed' ? new Date() : null
          }
        );
        break;

      case 'assignAgent':
        // Validate agent
        if (data.agentId) {
          const agent = await Agent.findById(data.agentId);
          if (!agent || !agent.isActive) {
            return res.status(400).json({ message: 'Invalid agent' });
          }
        }

        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { assignedAgent: data.agentId || null }
        );
        break;

      case 'updatePriority':
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { priority: data.priority }
        );
        break;

      case 'delete':
        // Update agent task counts
        const tasksToDelete = await Task.find({ _id: { $in: taskIds } });
        for (const task of tasksToDelete) {
          if (task.assignedAgent) {
            await Agent.findByIdAndUpdate(
              task.assignedAgent,
              { $inc: { tasksAssigned: -1 } }
            );
          }
        }

        result = await Task.deleteMany({ _id: { $in: taskIds } });
        break;

      default:
        return res.status(400).json({ message: 'Invalid bulk operation' });
    }

    res.json({
      message: `Bulk ${operation} completed successfully`,
      modifiedCount: result.modifiedCount || result.deletedCount,
      operation,
      taskIds
    });

    console.log(`🔄 Bulk ${operation} completed for ${taskIds.length} tasks`);

  } catch (error) {
    console.error('💥 Error in bulk operation:', error);
    res.status(500).json({ message: 'Bulk operation failed' });
  }
};

module.exports = {
  getAllTasks,
  getMyTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  bulkUpdateTasks
};
```

**The Query Builder Mastery**: Learning to build complex MongoDB queries with filtering, sorting, and pagination was like learning to conduct an orchestra - each part had to work in harmony!

## The Frontend Task Management Interface

### The Main TaskManagement Component
```jsx
// components/admin/TaskManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import httpClient from '../../utils/httpClient';
import TaskModal from './TaskModal';
import ConfirmDialog from '../ConfirmDialog';
import BulkActions from './BulkActions';

const TaskManagement = () => {
  // State management
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, 'in-progress': 0, completed: 0 });
  
  // Filter and search states
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedAgent: 'all',
    search: ''
  });
  
  // Pagination and sorting
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0
  });
  
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Modal states
  const [taskModal, setTaskModal] = useState({ isOpen: false, task: null, mode: 'create' });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, task: null });
  
  // Selection states
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch tasks with current filters and sorting
  const fetchTasks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        ...filters
      });

      const response = await httpClient.get(`/api/tasks/all?${params}`);
      
      setTasks(response.data.tasks);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
      
      // Clear selections when data changes
      setSelectedTasks([]);
      setSelectAll(false);

    } catch (error) {
      console.error('💥 Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, sorting]);

  // Fetch agents for assignment dropdown
  const fetchAgents = async () => {
    try {
      const response = await httpClient.get('/api/agents');
      setAgents(response.data.agents.filter(agent => agent.isActive));
    } catch (error) {
      console.error('💥 Error fetching agents:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchTasks();
    fetchAgents();
  }, [fetchTasks]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle sorting changes
  const handleSort = (field) => {
    setSorting(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle task creation/editing
  const handleTaskSave = async (taskData, mode) => {
    try {
      if (mode === 'create') {
        await httpClient.post('/api/tasks', taskData);
      } else {
        await httpClient.put(`/api/tasks/${taskData.id}`, taskData);
      }
      
      await fetchTasks(pagination.currentPage);
      setTaskModal({ isOpen: false, task: null, mode: 'create' });
      
    } catch (error) {
      console.error('💥 Error saving task:', error);
      throw error; // Let the modal handle the error display
    }
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    try {
      await httpClient.delete(`/api/tasks/${deleteDialog.task._id}`);
      await fetchTasks(pagination.currentPage);
      setDeleteDialog({ isOpen: false, task: null });
    } catch (error) {
      console.error('💥 Error deleting task:', error);
    }
  };

  // Handle status updates
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await httpClient.put(`/api/tasks/admin/${taskId}/status`, { status: newStatus });
      await fetchTasks(pagination.currentPage);
    } catch (error) {
      console.error('💥 Error updating task status:', error);
    }
  };

  // Selection handlers
  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task._id));
    }
    setSelectAll(!selectAll);
  };

  // Bulk operations
  const handleBulkOperation = async (operation, data) => {
    try {
      await httpClient.post('/api/tasks/bulk', {
        taskIds: selectedTasks,
        operation,
        data
      });
      
      await fetchTasks(pagination.currentPage);
      setSelectedTasks([]);
      setSelectAll(false);
    } catch (error) {
      console.error('💥 Error in bulk operation:', error);
    }
  };

  // Utility functions
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Manage and track all tasks in the system</p>
        </div>
        <button
          onClick={() => setTaskModal({ isOpen: true, task: null, mode: 'create' })}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-gray-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats['in-progress']}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Agent Filter */}
          <select
            value={filters.assignedAgent}
            onChange={(e) => handleFilterChange('assignedAgent', e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map(agent => (
              <option key={agent._id} value={agent._id}>{agent.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <BulkActions
          selectedCount={selectedTasks.length}
          agents={agents}
          onBulkOperation={handleBulkOperation}
        />
      )}

      {/* Tasks Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('firstName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Contact</span>
                    {sorting.sortBy === 'firstName' && (
                      sorting.sortOrder === 'asc' 
                        ? <ArrowUpIcon className="h-3 w-3" />
                        : <ArrowDownIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Priority</span>
                    {sorting.sortBy === 'priority' && (
                      sorting.sortOrder === 'asc' 
                        ? <ArrowUpIcon className="h-3 w-3" />
                        : <ArrowDownIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sorting.sortBy === 'status' && (
                      sorting.sortOrder === 'asc' 
                        ? <ArrowUpIcon className="h-3 w-3" />
                        : <ArrowDownIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Agent
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Created</span>
                    {sorting.sortBy === 'createdAt' && (
                      sorting.sortOrder === 'asc' 
                        ? <ArrowUpIcon className="h-3 w-3" />
                        : <ArrowDownIcon className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task._id)}
                      onChange={() => handleSelectTask(task._id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.firstName} {task.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{task.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.assignedAgent ? task.assignedAgent.name : 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTaskModal({ isOpen: true, task, mode: 'edit' })}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, task })}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchTasks(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchTasks(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span> 
                  {' '}({pagination.totalTasks} total tasks)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => fetchTasks(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchTasks(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={taskModal.isOpen}
        task={taskModal.task}
        mode={taskModal.mode}
        agents={agents}
        onClose={() => setTaskModal({ isOpen: false, task: null, mode: 'create' })}
        onSave={handleTaskSave}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete the task for ${deleteDialog.task?.firstName} ${deleteDialog.task?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteDialog({ isOpen: false, task: null })}
      />
    </div>
  );
};

export default TaskManagement;
```

**The State Management Symphony**: Managing all that state - filters, pagination, sorting, selections, modals - was like conducting an orchestra. Every piece had to work in harmony or the whole thing would collapse!

## The Task Modal Component

```jsx
// components/admin/TaskModal.jsx
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const TaskModal = ({ isOpen, task, mode, agents, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    priority: 'medium',
    assignedAgent: '',
    notes: '',
    dueDate: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && task) {
        setFormData({
          firstName: task.firstName || '',
          lastName: task.lastName || '',
          email: task.email || '',
          phone: task.phone || '',
          priority: task.priority || 'medium',
          assignedAgent: task.assignedAgent?._id || '',
          notes: task.notes || '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          priority: 'medium',
          assignedAgent: '',
          notes: '',
          dueDate: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, task, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const submitData = { ...formData };
      if (mode === 'edit') {
        submitData.id = task._id;
      }

      await onSave(submitData, mode);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save task';
      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(err => {
          // Parse field errors from server
          const match = err.match(/Path `(\w+)` (.+)/);
          if (match) {
            fieldErrors[match[1]] = match[2];
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    onClick={onClose}
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div>
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                    {mode === 'create' ? 'Create New Task' : 'Edit Task'}
                  </Dialog.Title>

                  {errors.general && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                      {errors.general}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 ${
                            errors.firstName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 ${
                            errors.lastName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact Fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 ${
                          errors.email
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 ${
                          errors.phone
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>

                    {/* Priority and Agent */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Assigned Agent
                        </label>
                        <select
                          name="assignedAgent"
                          value={formData.assignedAgent}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {agents.map(agent => (
                            <option key={agent._id} value={agent._id}>
                              {agent.name} ({agent.specialization})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional notes about this task..."
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Submit Buttons */}
                    <div className="mt-6 flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            {mode === 'create' ? 'Creating...' : 'Updating...'}
                          </>
                        ) : (
                          mode === 'create' ? 'Create Task' : 'Update Task'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default TaskModal;
```

**The Form Validation Ballet**: Creating client-side validation that works in harmony with server-side validation was like choreographing a dance. Every step had to be perfectly timed!

---

*With the task management empire built and thriving, our hero thought the hard work was over. Little did I know, the most notorious bug in the application was lurking in the shadows, waiting to challenge everything I had built...*

**Next Chapter**: *Chapter 9: The Status Update Wars - Where we discover and conquer the infamous "only admins can access this" bug that nearly drove our hero to madness*
