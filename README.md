# Task Management System
(CSTechInfo)
A MERN stack application for managing customer service tasks with admin and agent roles.

## 🚀 Features

### Admin Features
- **Admin Authentication**: Secure login with JWT tokens
- **Agent Management**: Create and manage customer service agents
- **File Upload**: Upload CSV, XLS, or XLSX files containing customer data
- **Task Distribution**: Automatically distribute tasks among agents using round-robin algorithm
- **Task Monitoring**: View all tasks and their status
- **Task Reassignment**: Manually reassign tasks between agents

### Agent Features  
- **Agent Authentication**: Secure login for agents
- **Task Management**: View assigned tasks
- **Status Updates**: Update task status (pending, in-progress, completed, failed)
- **Task Tracking**: Monitor personal task progress

## 🛠 Technical Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **File Processing**: Multer, csv-parser, xlsx
- **Security**: bcryptjs for password hashing

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v14 or higher)
- **MongoDB** (running locally or MongoDB Atlas connection)
- **npm** or **yarn** package manager

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CSTechInfo
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Configuration
Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/admin-app

# JWT Configuration  
JWT_SECRET=mysecretkey

# Server Configuration
PORT=5000

# Node Environment
NODE_ENV=development
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# If using local MongoDB
mongod

# Or ensure MongoDB Atlas connection is working
```

### 6. Run the Application

#### Start Backend Server (Terminal 1)
```bash
cd backend
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:5000`

#### Start Frontend Development Server (Terminal 2)
```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000`

## 📁 Project Structure

```
CSTechInfo/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection
│   ├── controllers/
│   │   ├── authController.js     # Admin authentication
│   │   ├── agentController.js    # Agent management
│   │   └── taskController.js     # Task operations
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT authentication
│   │   ├── errorHandler.js       # Error handling
│   │   └── uploadMiddleware.js   # File upload handling
│   ├── models/
│   │   ├── User.js              # Admin user model
│   │   ├── Agent.js             # Agent model
│   │   └── Task.js              # Task model
│   ├── routes/
│   │   ├── authRoutes.js        # Admin auth routes
│   │   ├── agentRoutes.js       # Agent routes
│   │   └── taskRoutes.js        # Task routes
│   ├── uploads/                 # File upload directory
│   ├── .env.example            # Environment template
│   ├── package.json
│   └── server.js               # Main server file
└── frontend/                   # React frontend application
    ├── public/
    ├── src/
    │   ├── components/         # React components
    │   ├── pages/             # Page components
    │   ├── services/          # API service calls
    │   ├── utils/             # Utility functions
    │   └── App.js             # Main App component
    ├── package.json
    └── README.md
```

## 🔧 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register admin user
- `POST /login` - Admin login
- `PUT /update` - Update admin profile (protected)

### Agent Routes (`/api/agents`)
- `POST /` - Create new agent (admin only)
- `GET /` - Get all agents (admin only)
- `POST /login` - Agent login

### Task Routes (`/api/tasks`)
- `GET /all` - Get all tasks (admin only)
- `POST /draft-upload` - Upload CSV/Excel file (admin only)
- `POST /confirm-draft` - Confirm and save tasks (admin only)
- `GET /my` - Get agent's tasks (agent only)
- `PUT /:id/status` - Update task status (agent only)
- `PATCH /task/:id/assign` - Reassign task (admin only)

## 📤 File Upload Format

The system accepts CSV, XLS, and XLSX files with the following format:

| FirstName | Phone | Notes |
|-----------|-------|-------|
| John      | +1234567890 | Follow up needed |
| Jane      | +1987654321 | High priority |

**Required Fields:**
- `FirstName` - Customer's first name (required)
- `Phone` - Customer's phone number (required)
- `Notes` - Additional notes (optional)

## 🔄 Task Distribution Logic

Tasks are distributed among agents using a **round-robin algorithm**:

1. System retrieves all available agents
2. Tasks are assigned sequentially: Agent 1, Agent 2, Agent 3, Agent 1, Agent 2...
3. Ensures equal distribution among all agents
4. If tasks aren't evenly divisible, remaining tasks are distributed sequentially

**Example**: 25 tasks with 5 agents = 5 tasks per agent

## 🌐 Frontend-Backend Integration

### API Base URL
Configure your frontend to connect to the backend:

```javascript
// In your React app (src/services/api.js)
const API_BASE_URL = 'http://localhost:5000/api';

// Example API service
export const authService = {
  login: (credentials) => 
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }),
  
  createAgent: (agentData, token) =>
    fetch(`${API_BASE_URL}/agents`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(agentData)
    })
};
```

### CORS Configuration
The backend is already configured to accept requests from your React frontend.

## 🧪 Testing the Full Application

### Backend Testing (API)

### 1. Register Admin
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### 2. Login Admin
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com", 
  "password": "admin123"
}
```

### 3. Create Agent (with admin token)
```bash
POST http://localhost:5000/api/agents
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "John Agent",
  "email": "agent@example.com",
  "phone": "+1234567890",
  "password": "agent123"
}
```

### 4. Upload CSV File
```bash
POST http://localhost:5000/api/tasks/draft-upload
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data
Form Data:
  file: <your-csv-file>
```

### Frontend Testing (UI)
1. Open `http://localhost:3000` in your browser
2. Test admin login functionality
3. Create agents through the UI
4. Upload CSV files and verify task distribution
5. Login as agent and test task management

## 🔧 Development Workflow

### Running Both Frontend and Backend
1. **Terminal 1**: Start backend server (`cd backend && npm run dev`)
2. **Terminal 2**: Start frontend server (`cd frontend && npm start`)
3. **Browser**: Open `http://localhost:3000` for the React app
4. **API**: Backend runs on `http://localhost:5000`

## 🚨 Error Handling

The application includes comprehensive error handling:

- **Validation Errors**: Invalid input data
- **Authentication Errors**: Invalid tokens or expired sessions
- **Database Errors**: MongoDB connection issues
- **File Upload Errors**: Invalid file types or corrupted files
- **Business Logic Errors**: No agents available, task not found, etc.

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin and agent role separation
- **Input Validation**: Mongoose schema validation
- **File Type Validation**: Only CSV, XLS, XLSX files allowed
- **Error Sanitization**: Sensitive information not exposed

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file (currently: mongodb://localhost:27017/admin-app)
   - Verify network connectivity

2. **JWT Token Invalid**
   - Check JWT_SECRET in .env file (currently set to "mysecretkey")
   - Ensure token is properly formatted
   - Verify token hasn't expired

3. **File Upload Issues**
   - Check file format (CSV, XLS, XLSX only)
   - Ensure file has required columns
   - Verify file isn't corrupted

4. **No Agents Available**
   - Create at least one agent before uploading tasks
   - Check agent creation was successful

5. **Frontend-Backend Connection Issues**
   - Ensure both servers are running
   - Check CORS configuration
   - Verify API_BASE_URL in frontend matches backend port
   - Check browser console for network errors

## 📝 Development Notes

- The system uses round-robin distribution (not load balancing)
- Tasks are distributed based on agent creation order
- File processing is done in memory for better performance
- All routes are protected with appropriate middleware

## 🎯 Future Enhancements

- Load balancing based on agent workload
- Real-time notifications
- Task priority levels
- Performance analytics
- Advanced reporting
- Email notifications
- Mobile responsive design
- Dark mode theme

## 📞 Support

For issues or questions, please check the troubleshooting section or contact the development team.

---

**Made with ❤️ for efficient task management**
