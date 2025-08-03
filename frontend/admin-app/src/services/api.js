import httpClient from './httpClient';
import { API_CONFIG } from '../utils/config';

export const authService = {
  // Admin login
  adminLogin: async (credentials) => {
    const response = await httpClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  // Agent login
  agentLogin: async (credentials) => {
    const response = await httpClient.post(API_CONFIG.ENDPOINTS.AGENTS.LOGIN, credentials);
    return response.data;
  },

  // Register admin (if needed)
  register: async (userData) => {
    const response = await httpClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  // Update admin profile
  updateProfile: async (userData) => {
    const response = await httpClient.put(API_CONFIG.ENDPOINTS.AUTH.UPDATE, userData);
    return response.data;
  },
};

export const agentService = {
  // Get all agents
  getAll: async () => {
    const response = await httpClient.get(API_CONFIG.ENDPOINTS.AGENTS.LIST);
    return response.data;
  },

  // Create new agent
  create: async (agentData) => {
    const response = await httpClient.post(API_CONFIG.ENDPOINTS.AGENTS.CREATE, agentData);
    return response.data;
  },

  // Update agent
  update: async (id, agentData) => {
    const response = await httpClient.put(`${API_CONFIG.ENDPOINTS.AGENTS.LIST}/${id}`, agentData);
    return response.data;
  },

  // Delete agent
  delete: async (id) => {
    const response = await httpClient.delete(`${API_CONFIG.ENDPOINTS.AGENTS.LIST}/${id}`);
    return response.data;
  },
};

export const taskService = {
  // Get all tasks (admin)
  getAll: async () => {
    const response = await httpClient.get(API_CONFIG.ENDPOINTS.TASKS.ALL);
    return response.data;
  },

  // Get agent's tasks
  getMyTasks: async () => {
    const response = await httpClient.get(API_CONFIG.ENDPOINTS.TASKS.MY_TASKS);
    return response.data;
  },

  // Upload CSV file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await httpClient.post(API_CONFIG.ENDPOINTS.TASKS.DRAFT_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Confirm draft tasks
  confirmDraft: async (tasks) => {
    const response = await httpClient.post(API_CONFIG.ENDPOINTS.TASKS.CONFIRM_DRAFT, { tasks });
    return response.data;
  },

  // Update task status
  updateStatus: async (taskId, status) => {
    const endpoint = API_CONFIG.ENDPOINTS.TASKS.UPDATE_STATUS.replace(':id', taskId);
    const response = await httpClient.put(endpoint, { status });
    return response.data;
  },

  // Reassign task
  reassign: async (taskId, newAgentId) => {
    const endpoint = API_CONFIG.ENDPOINTS.TASKS.REASSIGN.replace(':id', taskId);
    const response = await httpClient.patch(endpoint, { newAgentId });
    return response.data;
  },
};
