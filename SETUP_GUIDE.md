# TechTask Hub - Complete Setup Guide

## 🚀 Quick Start (No Errors!)

This is a complete, working Project Management App with:
- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + Bootstrap
- **Zero Native Dependencies**: No `better-sqlite3` or compilation errors!

---

## 📋 Prerequisites

- **Node.js 22+** (for built-in `node:sqlite` support)
- **npm** or **yarn**
- **Git** (optional)

---

## 🔧 Installation Steps

### Step 1: Create Project Folder

```bash
mkdir techtask-hub
cd techtask-hub
```

### Step 2: Setup Backend

```bash
mkdir backend
cd backend

# Create package.json
npm init -y

# Install dependencies
npm install express cors
```

**Copy the provided `server.js` into this folder**

### Step 3: Setup Frontend

```bash
# Go back to project root
cd ..

# Create React app
npx create-react-app frontend

cd frontend

# Install additional dependencies
npm install axios react-bootstrap bootstrap react-router-dom react-toastify react-icons
```

**Replace `src/App.js` with the provided `App.jsx`**

---

## 🎯 File Structure

```
techtask-hub/
├── backend/
│   ├── package.json
│   ├── server.js           ✅ Copy this file
│   └── database.sqlite     (auto-created)
│
└── frontend/
    ├── src/
    │   ├── App.js          (✅ Replace with App.jsx)
    │   ├── App.css         (add custom styles)
    │   ├── index.js
    │   └── ...
    ├── package.json
    └── ...
```

---

## ▶️ Running the Application

### Terminal 1: Start Backend Server

```bash
cd backend
npm start
```

Expected output:
```
🚀 TechTask Hub API running at http://localhost:5220
📦 Database: /path/to/backend/database.sqlite
📝 Health Check: http://localhost:5220/health
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm start
```

Frontend will open at `http://localhost:3000`

---

## 🔐 Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@mandela.ac.za | admin123 | Administrator |
| task@mandela.ac.za | task123 | Systems Analyst |
| pm@mandela.ac.za | pm123 | Project Manager |
| dev@mandela.ac.za | dev123 | Web Developer |

---

## 📊 Features

### Admin Dashboard
- ✅ View all employees
- ✅ Create new employees
- ✅ Delete employees
- ✅ Update employee info

### Project Manager Dashboard
- ✅ Create projects
- ✅ View all projects
- ✅ Delete projects
- ✅ Create tasks
- ✅ Assign tasks to employees
- ✅ View task status
- ✅ Delete tasks

### Database Schema

**Employees Table**
- EmployeeId (Primary Key)
- Name, Surname, JobTitle
- Email, Password

**Projects Table**
- ProjectId (Primary Key)
- ProjectName, ProjectStatus, ProjectDesc
- StartDate, EndDate

**Tasks Table**
- TaskId (Primary Key)
- TaskName, TaskDesc, TaskStatus
- AssignedTime, CompletedTime
- AssignedToEmployeeId (Foreign Key)
- ProjectId (Foreign Key)

---

## 🐛 Troubleshooting

### Issue: "EADDRINUSE: Port 5220 already in use"
**Solution**: Kill the process or use a different port
```bash
# Windows
netstat -ano | findstr :5220
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5220
kill -9 <PID>
```

### Issue: "CORS Error"
**Solution**: Ensure backend is running on port 5220 and frontend on port 3000

### Issue: "Database locked"
**Solution**: Delete old database files and restart
```bash
rm database.sqlite*
npm start
```

### Issue: "Module not found: axios, bootstrap, etc."
**Solution**: Reinstall dependencies
```bash
cd frontend
npm install
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Admin Routes
- `GET /api/admin/employees` - Get all employees
- `POST /api/admin/create-employee` - Create employee
- `PUT /api/admin/update-employee/:id` - Update employee
- `DELETE /api/admin/delete-employee/:id` - Delete employee
- `GET /api/admin/get-employee-by-name?name=John` - Search by name
- `GET /api/admin/get-employee-by-email?email=...` - Search by email

### Project Manager Routes
- `GET /api/projectmanager/get-projects` - Get all projects
- `POST /api/projectmanager/create-project` - Create project
- `PUT /api/projectmanager/update-project/:id` - Update project
- `DELETE /api/projectmanager/delete-project/:id` - Delete project

### Task Routes
- `GET /api/projectmanager/get-tasks` - Get all tasks
- `POST /api/projectmanager/create-task` - Create task
- `GET /api/projectmanager/get-tasks-by-status/:status` - Filter by status
- `GET /api/projectmanager/get-tasks-by-employee/:employeeId` - Filter by employee
- `PUT /api/projectmanager/update-task/:id` - Update task
- `DELETE /api/projectmanager/delete-task/:id` - Delete task

### Health Check
- `GET /health` - Check server status

---

## 📝 Example API Calls

### Login
```bash
curl -X POST http://localhost:5220/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mandela.ac.za","password":"admin123"}'
```

### Create Employee
```bash
curl -X POST http://localhost:5220/api/admin/create-employee \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John",
    "surname":"Doe",
    "jobTitle":"Developer",
    "email":"john@example.com",
    "password":"pass123"
  }'
```

### Create Project
```bash
curl -X POST http://localhost:5220/api/projectmanager/create-project \
  -H "Content-Type: application/json" \
  -d '{
    "projectName":"Website Redesign",
    "projectStatus":"Active",
    "projectDesc":"Redesign company website",
    "startDate":"2026-04-01",
    "endDate":"2026-06-01"
  }'
```

---

## 🎨 Customization

### Change Backend Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Change 5220 to 3001
```

### Change Frontend Proxy
Edit `frontend/package.json`:
```json
"proxy": "http://localhost:3001"
```

### Add More Database Fields
Edit table creation in `server.js`:
```javascript
ALTER TABLE Employees ADD COLUMN Phone TEXT;
```

---

## 📦 Deploy (Optional)

### Deploy Backend (Heroku/Render)
```bash
cd backend
git push heroku main
```

### Deploy Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the 'build' folder
```

---

## ✅ Verification Checklist

- [ ] Node.js 22+ installed: `node --version`
- [ ] Backend dependencies installed: `npm list` in backend folder
- [ ] Frontend dependencies installed: `npm list` in frontend folder
- [ ] Backend runs without errors: `npm start` (backend)
- [ ] Frontend runs without errors: `npm start` (frontend)
- [ ] Database created: Check `backend/database.sqlite`
- [ ] Can login with default credentials
- [ ] Can create employees (Admin)
- [ ] Can create projects (PM)
- [ ] Can create tasks (PM)

---

## 🆘 Still Having Issues?

1. **Check ports are available**: `5220` (backend), `3000` (frontend)
2. **Check Node version**: `node --version` (must be 22+)
3. **Clear npm cache**: `npm cache clean --force`
4. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
5. **Check firewall**: Ensure ports aren't blocked

---

## 📚 Additional Resources

- Express.js Docs: https://expressjs.com/
- React Docs: https://react.dev/
- Bootstrap: https://getbootstrap.com/
- SQLite: https://www.sqlite.org/

---

**🎉 You're all set! Happy coding!**
