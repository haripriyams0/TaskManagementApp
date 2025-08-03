import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  Building,
  User
} from 'lucide-react';
import httpClient from '../../services/httpClient';
import { API_CONFIG } from '../../utils/config';
import { useNotifications } from '../../context/NotificationContext';

const TaskManagement = () => {
  const { addTaskNotification } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(10);

  useEffect(() => {
    fetchTasks();
    fetchAgents();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.TASKS.ALL);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.AGENTS.LIST);
      setAgents(response.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [taskId]: true }));
      await httpClient.patch(`/tasks/admin/${taskId}/status`, { status: newStatus });
      
      // Find the task to get contact name for notification
      const task = tasks.find(t => t._id === taskId);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // Add notification based on status change
      if (newStatus === 'completed' && task) {
        addTaskNotification('task_completed', {
          firstName: task.firstName,
          phone: task.phone,
          taskId: taskId
        });
      }
      
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const reassignTask = async (taskId, newAgentId) => {
    try {
      setActionLoading(prev => ({ ...prev, [taskId]: true }));
      await httpClient.patch(`/tasks/task/${taskId}/assign`, { newAgentId });
      
      // Update local state
      const newAgent = agents.find(agent => agent._id === newAgentId);
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { 
            ...task, 
            assignedTo: newAgentId,
            agentId: newAgent ? { _id: newAgent._id, name: newAgent.name, email: newAgent.email } : null
          } : task
        )
      );
    } catch (error) {
      console.error('Error reassigning task:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.phone?.includes(searchTerm) ||
      task.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.agentId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || task.agentId?._id === agentFilter;

    return matchesSearch && matchesStatus && matchesAgent;
  });

  // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'in-progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const TaskModal = () => {
    if (!selectedTask) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Task Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{selectedTask.firstName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{selectedTask.phone}</span>
                  </div>
                </div>
              </div>

              {/* Task Notes */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedTask.notes || 'No notes available'}
                </p>
              </div>

              {/* Assignment Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned Agent</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedTask.agentId?.name || 'Not assigned'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <span className={getStatusBadge(selectedTask.status)}>
                        {selectedTask.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedTask.createdAt)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedTask.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    updateTaskStatus(selectedTask._id, e.target.value);
                    setSelectedTask({ ...selectedTask, status: e.target.value });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={selectedTask.agentId?._id || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      reassignTask(selectedTask._id, e.target.value);
                      const newAgent = agents.find(agent => agent._id === e.target.value);
                      setSelectedTask({ 
                        ...selectedTask, 
                        agentId: newAgent ? { _id: newAgent._id, name: newAgent.name, email: newAgent.email } : null 
                      });
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select Agent</option>
                  {agents.map(agent => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage all tasks across your organization
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks by name, phone, notes, or agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Agent Filter */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Agents</option>
            {agents.map(agent => (
              <option key={agent._id} value={agent._id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {currentTasks.length} of {filteredTasks.length} tasks
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tasks...</p>
          </div>
        ) : currentTasks.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="text-gray-600">
              {filteredTasks.length === 0 
                ? "No tasks have been created yet." 
                : "No tasks match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.firstName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {task.notes || 'No notes'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {task.agentId?.name || 'Not assigned'}
                      </div>
                      {task.agentId?.email && (
                        <div className="text-sm text-gray-500">
                          {task.agentId.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(task.status)}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(task.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                          disabled={actionLoading[task._id]}
                          className="text-xs border border-gray-300 rounded px-1 py-1"
                          title="Change Status"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstTask + 1} to {Math.min(indexOfLastTask, filteredTasks.length)} of {filteredTasks.length} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && <TaskModal />}
    </div>
  );
};

export default TaskManagement;
