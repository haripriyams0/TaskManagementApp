const Task = require('../models/Task');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const Agent = require('../models/Agent');

exports.getAllTasks = async (req, res) => {
    try {
        const { agentId } = req.query;
        let query = {};
        
        // If agentId is provided, filter by it
        if (agentId) {
            query.agentId = agentId;
        }
        
        const tasks = await Task.find(query).populate('agentId', 'name email');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAgentTasks = async (req, res) => {
    try {
        // Look for tasks assigned to this agent using both fields for compatibility
        const tasks = await Task.find({ 
            $or: [
                { assignedTo: req.user.id },
                { agentId: req.user.id }
            ]
        }).populate('assignedTo', 'name email');
        res.json(tasks);
    } catch (error) {
        console.error('[Get Agent Tasks Error]', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.draftUpload = async (req, res) => {
    try {
        if(!req.file) {
            return res.status(400).json({ message: 'No file uploaded'});
        }

        const agents = await Agent.find();
        if (!agents.length) {
            return res.status(400).json({ message: 'No agents available' });
        }

        const results = [];
        const buffer = req.file.buffer;
        const fileType = req.file.mimetype;

        // Handle Excel files (.xlsx, .xls)
        if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            fileType === 'application/vnd.ms-excel') {
            
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);

            jsonData.forEach((row) => {
                const { FirstName, Phone, Notes } = row;
                if (FirstName && Phone) {
                    results.push({
                        firstName: String(FirstName).trim(),
                        phone: String(Phone).trim(),
                        notes: Notes ? String(Notes).trim() : '',
                    });
                }
            });

            // Process and assign to agents
            const draft = results.map((task, index) => {
                const agent = agents[index % agents.length];
                return {
                    ...task,
                    agentId: agent._id,
                    assignedTo: agent._id,
                    draftAssignedTo: {
                        id: agent._id, 
                        name: agent.name, 
                        email: agent.email, 
                    }
                };
            });

            res.status(200).json({
                total: draft.length,
                draft,
            });

        } 
        // Handle CSV files
        else if (fileType === 'text/csv') {
            const stream = require('stream');
            const readStream = new stream.PassThrough();
            readStream.end(buffer);

            readStream
                .pipe(csv())
                .on('data', (data) => {
                    const { FirstName, Phone, Notes } = data;
                    if (FirstName && Phone) {
                        results.push({
                            firstName: FirstName.trim(),
                            phone: Phone.trim(),
                            notes: Notes?.trim() || '',
                        });
                    }
                })
                .on('end', () => {
                    const draft = results.map((task, index) => {
                        const agent = agents[index % agents.length];
                        return {
                            ...task,
                            agentId: agent._id,
                            assignedTo: agent._id,
                            draftAssignedTo: {
                                id: agent._id, 
                                name: agent.name, 
                                email: agent.email, 
                            }
                        };
                    });

                    res.status(200).json({
                        total: draft.length,
                        draft,
                    });
                });
        } else {
            return res.status(400).json({ message: 'Unsupported file type' });
        }

    } catch (err) {
        console.error("Draft upload error:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.confirmDraft = async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ message: 'No tasks provided.' });
        }

        // Process tasks to ensure they have the correct structure
        const processedTasks = tasks.map(task => ({
            firstName: task.firstName,
            phone: task.phone,
            notes: task.notes || '',
            agentId: task.draftAssignedTo?.id || task.agentId,
            assignedTo: task.draftAssignedTo?.id || task.assignedTo,
            status: 'pending',
            isFinalized: false
        }));

        // Save all tasks to DB
        const inserted = await Task.insertMany(processedTasks);

        res.status(201).json({
            message: 'Tasks saved successfully',
            count: inserted.length,
        });
    } catch (error) {
        console.error('[Confirm Draft Error]', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getMyTasks = async (req, res) => {
    try {
        if (req.user.role !== 'agent') {
            return res.status(403).json({ message: 'Only agents can access this route.'});
        }

        const agentId = req.user._id;

        const tasks = await Task.find({ assignedTo: agentId });

        res.status(200).json({
            message: 'Tasks fetched successfully',
            tasks,
        });
    } catch (error) {
        console.error('[Get My Tasks Error]', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { status } = req.body;

        // Allowed statuses
        const allowedStatuses = ['pending', 'in-progress', 'completed', 'failed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value'});
        }

        //Find task
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check permissions: Admin can update any task, Agent can only update their own
        if (req.user.role === 'agent') {
            // For agents, check if they are assigned to this task (using both agentId and assignedTo for compatibility)
            const isAssigned = String(task.assignedTo) === String(req.user.id) || 
                              String(task.agentId) === String(req.user.id);
            
            if (!isAssigned) {
                return res.status(403).json({ message: 'You are not assigned to this task'});
            }
        }
        // Admin doesn't need permission check, they can update any task

        //Update status
        task.status = status;
        await task.save();

        res.status(200).json({ message: 'Task status updated successfully', task });
    } catch (error) {
        console.error('[Task Status Update Error]', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.reassignTask = async (req, res) => {
  const { id } = req.params;
  const { newAgentId } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.assignedTo = newAgentId;
    await task.save();

    res.status(200).json({ message: 'Task reassigned successfully', task });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.finalizeAssignments = async (req, res) => {
  try {
    await Task.updateMany({ isFinalized: false }, { isFinalized: true });
    res.status(200).json({ message: 'All tasks finalized successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error finalizing tasks', error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === 'admin') {
      tasks = await Task.find().populate('assignedTo', 'name email');
    } else {
      tasks = await Task.find({ assignedTo: req.user.id, isFinalized: true });
    }

    res.status(200).json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
};

