import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear a notification
  const clearNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const newNotifications = prev.filter(n => n.id !== notificationId);
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return newNotifications;
    });
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Add system notifications based on user role and activity
  const addTaskNotification = (type, taskData) => {
    let title, message, notificationType;

    switch (type) {
      case 'task_assigned':
        title = 'New Task Assigned';
        message = `Task for ${taskData.firstName} has been assigned to ${taskData.agentName}`;
        notificationType = 'info';
        break;
      case 'task_completed':
        title = 'Task Completed';
        message = `Task for ${taskData.firstName} has been completed`;
        notificationType = 'success';
        break;
      case 'task_overdue':
        title = 'Task Overdue';
        message = `Task for ${taskData.firstName} is overdue`;
        notificationType = 'warning';
        break;
      case 'bulk_upload':
        title = 'Bulk Upload Complete';
        message = `${taskData.count} tasks have been successfully uploaded`;
        notificationType = 'success';
        break;
      default:
        title = 'Task Update';
        message = 'A task has been updated';
        notificationType = 'info';
    }

    addNotification({
      title,
      message,
      type: notificationType,
      category: 'task',
      data: taskData
    });
  };

  const addAgentNotification = (type, agentData) => {
    let title, message, notificationType;

    switch (type) {
      case 'agent_created':
        title = 'New Agent Added';
        message = `Agent ${agentData.name} has been created`;
        notificationType = 'success';
        break;
      case 'agent_login':
        title = 'Agent Login';
        message = `${agentData.name} has logged in`;
        notificationType = 'info';
        break;
      default:
        title = 'Agent Update';
        message = 'An agent has been updated';
        notificationType = 'info';
    }

    addNotification({
      title,
      message,
      type: notificationType,
      category: 'agent',
      data: agentData
    });
  };

  // Initialize with welcome notification
  useEffect(() => {
    if (user) {
      const welcomeMessage = user.role === 'admin' 
        ? 'Welcome to the admin dashboard!' 
        : 'Welcome! Check your assigned tasks.';
      
      addNotification({
        title: `Welcome back, ${user.name || user.email}!`,
        message: welcomeMessage,
        type: 'info',
        category: 'system'
      });
    }
  }, [user?.id]); // Only trigger when user changes

  const value = {
    notifications,
    unreadCount,
    addNotification,
    addTaskNotification,
    addAgentNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
