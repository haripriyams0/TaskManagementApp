# CSTechInfo Technical Documentation

## 🏗️ System Architecture

### **Technology Stack:**
- **Frontend:** React 18, Vite, Tailwind CSS v3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **File Processing:** Multer, CSV-Parser, XLSX
- **Icons:** Lucide React
- **Routing:** React Router Dom v6

### **Project Structure:**
```
CSTechInfo/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── agentController.js
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Agent.js
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/
│   │   ├── agentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   └── uploadRoutes.js
│   ├── uploads/
│   ├── package.json
│   └── server.js
├── frontend/admin-app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   └── notifications/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── agent/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
└── USER_GUIDE.md
```

---

## 🗄️ Database Schema

### **User Model:**
```javascript
{
  _id: ObjectId,
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'agent'], default: 'admin'),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Agent Model:**
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Task Model:**
```javascript
{
  _id: ObjectId,
  firstName: String (required),
  phone: String (required),
  notes: String (default: ''),
  agentId: ObjectId (ref: 'Agent'),
  assignedTo: ObjectId (ref: 'Agent'),
  status: String (enum: ['pending', 'in-progress', 'completed', 'failed'], default: 'pending'),
  isFinalized: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 API Endpoints

### **Authentication Routes:**
```
POST /api/auth/login          - User login
POST /api/auth/register       - User registration  
PUT  /api/auth/update         - Update user profile
```

### **Agent Management Routes:**
```
POST /api/agents              - Create new agent (Admin only)
GET  /api/agents              - Get all agents (Admin only)
POST /api/agents/login        - Agent login
```

### **Task Management Routes:**
```
GET  /api/tasks/all           - Get all tasks (Admin only)
GET  /api/tasks/my            - Get agent's tasks (Agent only)
GET  /api/tasks/my-tasks      - Alternative agent tasks endpoint
PATCH /api/tasks/admin/:id/status    - Update task status (Admin)
PATCH /api/tasks/agent/:id/status    - Update task status (Agent)
PATCH /api/tasks/task/:id/assign     - Reassign task (Admin only)
```

### **File Upload Routes:**
```
POST /api/tasks/draft-upload  - Upload CSV for preview (Admin only)
POST /api/tasks/confirm-draft - Confirm draft tasks (Admin only)
```

---

## 🔐 Authentication & Authorization

### **JWT Token Structure:**
```javascript
{
  id: user._id,
  role: 'admin' | 'agent',
  iat: timestamp,
  exp: timestamp (24h expiry)
}
```

### **Middleware Protection:**
- **protect:** Validates JWT token
- **requireRole(role):** Checks user role
- **Role-based routes:** Admin vs Agent access

### **Route Protection Examples:**
```javascript
// Admin only
router.get('/all', protect, requireRole('admin'), getAllTasks);

// Agent only  
router.get('/my', protect, requireRole('agent'), getAgentTasks);

// Admin-specific status updates
router.patch('/admin/:id/status', protect, requireRole('admin'), updateTaskStatus);

// Agent-specific status updates
router.patch('/agent/:id/status', protect, requireRole('agent'), updateTaskStatus);
```

---

## 📤 File Upload System

### **Supported Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)

### **Required CSV Structure:**
```csv
FirstName,Phone,Notes
John Smith,555-0123,Follow up on service inquiry
Jane Doe,555-0456,Technical support needed
```

### **Upload Workflow:**
1. **File Upload:** Multer middleware processes file
2. **Parse & Validate:** CSV-parser extracts data
3. **Agent Assignment:** Round-robin distribution
4. **Draft Creation:** Temporary task storage
5. **Preview:** Admin reviews assignments
6. **Confirmation:** Tasks saved to database
7. **Notifications:** System alerts sent

### **Error Handling:**
- File format validation
- Required field checking
- Duplicate prevention
- Agent availability verification

---

## 🔔 Notification System Architecture

### **Context Structure:**
```javascript
NotificationContext = {
  notifications: Array<Notification>,
  unreadCount: Number,
  addNotification: Function,
  addTaskNotification: Function,
  addAgentNotification: Function,
  markAsRead: Function,
  markAllAsRead: Function,
  clearNotification: Function,
  clearAllNotifications: Function
}
```

### **Notification Object:**
```javascript
{
  id: String (timestamp + random),
  title: String,
  message: String,
  type: 'success' | 'info' | 'warning' | 'error',
  category: 'task' | 'agent' | 'system',
  timestamp: Date,
  read: Boolean,
  data: Object (optional context data)
}
```

### **Auto-notification Triggers:**
- **Task Status Changes:** When tasks are completed
- **Bulk Uploads:** When CSV files are processed
- **Agent Creation:** When new agents are added
- **System Events:** Welcome messages, errors

---

## 🎨 Frontend Architecture

### **Component Structure:**
```
src/
├── components/
│   ├── common/
│   │   └── ProtectedRoute.jsx
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Layout.jsx
│   │   └── Sidebar.jsx
│   └── notifications/
│       └── NotificationDropdown.jsx
├── context/
│   ├── AuthContext.jsx
│   └── NotificationContext.jsx
├── pages/
│   ├── admin/
│   │   ├── Dashboard.jsx
│   │   ├── AgentManagement.jsx
│   │   ├── TaskManagement.jsx
│   │   └── FileUpload.jsx
│   ├── agent/
│   │   ├── Dashboard.jsx
│   │   └── MyTasks.jsx
│   ├── Login.jsx
│   └── NotFound.jsx
├── services/
│   └── httpClient.js
├── utils/
│   ├── config.js
│   └── helpers.js
└── App.jsx
```

### **State Management:**
- **AuthContext:** User authentication and role management
- **NotificationContext:** Global notification system
- **Component State:** Local UI state with useState/useEffect

### **Routing Structure:**
```javascript
Routes:
  /login                    - Login page
  /admin/dashboard         - Admin overview
  /admin/agents           - Agent management
  /admin/tasks            - Task management  
  /admin/upload           - File upload
  /agent/dashboard        - Agent overview
  /agent/my-tasks         - Agent task list
  /*                      - 404 page
```

---

## 🔧 Development Setup

### **Prerequisites:**
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### **Environment Variables:**
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/cstechinfo
JWT_SECRET=your-secret-key
PORT=5000

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

### **Installation:**
```bash
# Clone repository
git clone <repo-url>
cd CSTechInfo

# Backend setup
cd backend
npm install
npm start

# Frontend setup (new terminal)
cd ../frontend/admin-app
npm install
npm run dev
```

### **Development Commands:**
```bash
# Backend
npm start          # Start server (port 5000)
npm run dev        # Start with nodemon

# Frontend  
npm run dev        # Start dev server (port 5173)
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 🧪 Testing & Quality

### **Manual Testing Checklist:**

**Authentication:**
- [ ] Admin login/logout
- [ ] Agent login/logout
- [ ] Protected route access
- [ ] Role-based redirects

**Admin Features:**
- [ ] Dashboard statistics
- [ ] Agent creation
- [ ] CSV file upload
- [ ] Task management
- [ ] Status updates
- [ ] Task reassignment

**Agent Features:**
- [ ] Agent dashboard
- [ ] Task status updates
- [ ] Personal statistics
- [ ] Task filtering

**Notifications:**
- [ ] Bell icon badge updates
- [ ] Notification dropdown
- [ ] Mark as read functionality
- [ ] Auto-notifications

### **Common Test Scenarios:**
1. **File Upload:** Test various CSV formats and error cases
2. **Task Workflow:** Complete task lifecycle from creation to completion
3. **Role Switching:** Test both admin and agent perspectives
4. **Error Handling:** Network failures, invalid data, permission errors

---

## 🚀 Deployment

### **Production Checklist:**
- [ ] Environment variables configured
- [ ] Database connection secured
- [ ] JWT secret generated
- [ ] CORS settings configured
- [ ] File upload limits set
- [ ] Error logging enabled
- [ ] HTTPS enabled
- [ ] Rate limiting implemented

### **Performance Optimization:**
- [ ] Database indexing on frequently queried fields
- [ ] Image/file compression
- [ ] Caching strategies
- [ ] Bundle size optimization
- [ ] Lazy loading implementation

---

## 🔍 Monitoring & Logging

### **Key Metrics to Monitor:**
- API response times
- Database query performance
- File upload success rates
- User activity patterns
- Error frequencies
- Notification delivery rates

### **Logging Recommendations:**
- User authentication events
- File upload activities
- Task status changes
- Error occurrences
- Performance bottlenecks

---

## 🛡️ Security Considerations

### **Implemented Security Measures:**
- Password hashing (bcrypt)
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- File type validation
- CORS configuration

### **Additional Security Recommendations:**
- Rate limiting on API endpoints
- Request size limits
- SQL injection prevention
- XSS protection
- CSRF tokens
- Regular security audits

---

## 📋 Known Issues & Limitations

### **Current Limitations:**
1. **Single File Upload:** Only one CSV file at a time
2. **No Email Integration:** Manual notification system only
3. **Limited Task Fields:** Basic contact information only
4. **No Audit Trail:** Limited activity logging
5. **No Bulk Operations:** Individual task management only

### **Future Improvements:**
1. **Real-time WebSocket Updates:** Live task updates
2. **Advanced Search:** Full-text search capabilities
3. **Export Functionality:** Download reports and data
4. **Mobile Optimization:** Better mobile experience
5. **API Documentation:** Swagger/OpenAPI documentation

---

## 🤝 Contributing

### **Development Guidelines:**
1. Follow consistent coding style
2. Add comments for complex logic
3. Test new features thoroughly
4. Update documentation
5. Follow Git commit conventions

### **Code Review Process:**
1. Create feature branch
2. Implement changes
3. Test functionality
4. Submit pull request
5. Code review and approval
6. Merge to main branch

---

*This technical documentation provides comprehensive information for developers working on the CSTechInfo system. Keep it updated as the system evolves.*
