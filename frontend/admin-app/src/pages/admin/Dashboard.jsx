import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle, Clock, TrendingUp, Activity, Bell } from 'lucide-react';
import httpClient from '../../services/httpClient';
import { API_CONFIG } from '../../utils/config';
import { useNotifications } from '../../context/NotificationContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch agents
      const agentsResponse = await httpClient.get(API_CONFIG.ENDPOINTS.AGENTS.LIST);
      const agents = agentsResponse.data || [];

      // Fetch tasks
      const tasksResponse = await httpClient.get(API_CONFIG.ENDPOINTS.TASKS.ALL);
      const tasks = tasksResponse.data || [];

      // Calculate stats
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const pendingTasks = tasks.filter(task => task.status === 'pending').length;

      setStats({
        totalAgents: agents.length,
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
      });

      // Generate recent activity from actual data
      const activities = [];
      
      // Add recent agents (last 5)
      const recentAgents = agents
        .filter(agent => agent.createdAt) // Only include agents with valid dates
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      recentAgents.forEach(agent => {
        activities.push({
          id: `agent-${agent._id}`,
          action: `New agent "${agent.name}" created`,
          time: formatTimeAgo(agent.createdAt),
          timestamp: new Date(agent.createdAt), // Add timestamp for sorting
          type: 'success'
        });
      });

      // Add recent tasks (last 5)
      const recentTasks = tasks
        .filter(task => task.createdAt) // Only include tasks with valid dates
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      recentTasks.forEach(task => {
        // Use firstName instead of name for tasks
        const taskName = task.firstName || 'Unnamed Contact';
        const action = task.status === 'completed' 
          ? `Task "${taskName}" completed` 
          : `Task "${taskName}" assigned`;
        
        activities.push({
          id: `task-${task._id}`,
          action,
          time: formatTimeAgo(task.updatedAt || task.createdAt),
          timestamp: new Date(task.updatedAt || task.createdAt), // Add timestamp for sorting
          type: task.status === 'completed' ? 'success' : 'info'
        });
      });

      // Sort by most recent and limit to 5
      setRecentActivity(
        activities
          .sort((a, b) => b.timestamp - a.timestamp) // Use timestamp for sorting
          .slice(0, 5)
      );

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to empty activity if API fails
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    const now = new Date();
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your task management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Agents"
          value={stats.totalAgents}
          icon={Users}
          color="bg-blue-500"
          description="Active agents"
        />
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={ClipboardList}
          color="bg-indigo-500"
          description="All tasks"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckCircle}
          color="bg-green-500"
          description={`${completionRate}% completion rate`}
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={Clock}
          color="bg-yellow-500"
          description="Awaiting action"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Task Completion Trend</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be displayed here</p>
              <p className="text-sm text-gray-400">Performance analytics coming soon</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              ))
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Activity will appear here as you use the system</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/admin/agents')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors group"
          >
            <Users className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Add New Agent</p>
          </button>
          <button 
            onClick={() => navigate('/admin/upload')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors group"
          >
            <ClipboardList className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Upload Tasks</p>
          </button>
          <button 
            onClick={() => navigate('/admin/tasks')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors group"
          >
            <TrendingUp className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">View Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
