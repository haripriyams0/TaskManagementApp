// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      UPDATE: '/auth/update',
    },
    // Agent endpoints
    AGENTS: {
      CREATE: '/agents',
      LIST: '/agents',
      LOGIN: '/agents/login',
    },
    // Task endpoints
    TASKS: {
      ALL: '/tasks/all',
      MY_TASKS: '/tasks/my',
      DRAFT_UPLOAD: '/tasks/draft-upload',
      CONFIRM_DRAFT: '/tasks/confirm-draft',
      UPDATE_STATUS: '/tasks/:id/status',
      REASSIGN: '/tasks/task/:id/assign',
    }
  }
};

// Request timeout
export const REQUEST_TIMEOUT = 10000;

// Token key for localStorage
export const TOKEN_KEY = 'cstechinfo_token';

// User data key for localStorage
export const USER_KEY = 'cstechinfo_user';
