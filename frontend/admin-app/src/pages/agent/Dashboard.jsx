import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertCircle, User, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import httpClient from '../../services/httpClient';
import { API_CONFIG } from '../../utils/config';

const AgentDashboard = () => {
  const { user } = useAuth();
  const { addTaskNotification } = useNotifications();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAgentData();
    }
  }, [user]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      console.log('Fetching agent data for user:', user);
      // Fetch tasks assigned to this agent using the correct endpoint
      const tasksResponse = await httpClient.get(API_CONFIG.ENDPOINTS.TASKS.MY_TASKS);
      const tasks = tasksResponse.data || [];
      console.log('Fetched tasks:', tasks);

      // Calculate stats
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const pendingTasks = tasks.filter(task => task.status === 'pending').length;
      const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
      
      // Since we don't have dueDate in the model, we'll calculate overdue as older pending tasks
      const overdueTasks = tasks.filter(task => {
        if (task.status === 'completed') return false;
        const taskDate = new Date(task.createdAt);
        const daysDiff = Math.floor((new Date() - taskDate) / (1000 * 60 * 60 * 24));
        return daysDiff > 7; // Consider tasks older than 7 days as overdue if not completed
      }).length;

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks: pendingTasks + inProgressTasks,
        overdueTasks,
      });

      // Get recent tasks (last 5 updated)
      const recent = tasks
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5);
      
      setRecentTasks(recent);
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      console.log('Updating task status:', { taskId, newStatus, user });
      const response = await httpClient.patch(`/tasks/agent/${taskId}/status`, { status: newStatus });
      console.log('Status update response:', response);
      
      // Find the task for notification
      const task = recentTasks.find(t => t._id === taskId);
      
      // Add notification for task completion
      if (newStatus === 'completed' && task) {
        addTaskNotification('task_completed', {
          firstName: task.firstName,
          phone: task.phone,
          taskId: taskId
        });
      }
      
      // Refresh the data after updating
      fetchAgentData();
    } catch (error) {
      console.error('Error updating task status:', error);
      console.error('Error details:', error.response?.data);
      // Show user-friendly error message
      alert(`Failed to update task status: ${error.response?.data?.message || error.message}`);
    }
  };

  const refreshData = () => {
    fetchAgentData();
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.name || 'Agent'}! Here's your task overview.
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={ClipboardList}
          color="bg-indigo-500"
          description="Assigned to you"
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks}
          icon={CheckCircle}
          color="bg-green-500"
          description={`${completionRate}% completion rate`}
        />
        <StatCard
          title="Pending"
          value={stats.pendingTasks}
          icon={Clock}
          color="bg-yellow-500"
          description="Awaiting completion"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueTasks}
          icon={AlertCircle}
          color="bg-red-500"
          description="Past due date"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
          <div className="space-y-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
              ))
            ) : recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{task.firstName}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : task.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : task.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-4">
                      <span>📞 {task.phone}</span>
                    </div>
                    {task.notes && (
                      <p className="mt-1 text-xs text-gray-500 truncate">{task.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Updated: {formatDate(task.updatedAt || task.createdAt)}
                    </div>
                    {task.status !== 'completed' && (
                      <div className="flex space-x-1">
                        {task.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('Start button clicked for task:', task._id);
                              updateTaskStatus(task._id, 'in-progress');
                            }}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title="Start Task"
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Complete button clicked for task:', task._id);
                            updateTaskStatus(task._id, 'completed');
                          }}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          title="Mark Complete"
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No tasks assigned yet</p>
                <p className="text-sm text-gray-400">Tasks will appear here when assigned to you</p>
              </div>
            )}
          </div>
        </div>

        {/* Agent Profile Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-2 rounded-full">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name || 'Agent'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {stats.overdueTasks > 0 && (
              <div className="border-t pt-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-red-600">Please review and complete soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
