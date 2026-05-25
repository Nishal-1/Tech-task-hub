TechTask Hub
A full-stack project and task management platform with role-based access control, built with React, Node.js, Express, and SQLite. Also runs as a native desktop app via Electron.
Features

Role-based access control across 4 user types: Admin, Project Manager, Systems Analyst, and Web Developer
Each role gets a dedicated dashboard with role-specific permissions
Project creation, assignment, and tracking
Task management with status updates
Secure authentication system
SQLite database with no external DB dependency
Runs as a native desktop app via Electron

Tech Stack
Frontend: React, Vite, Bootstrap
Backend: Node.js, Express
Database: SQLite
Desktop: Electron
Auth: Session-based authentication
Getting Started
Prerequisites

Node.js v18+
npm

Installation
bashgit clone https://github.com/nishal-1/Tech-task-hub
cd Tech-task-hub
npm install
Run as Web App
bashnpm run dev
Frontend runs at http://localhost:3000
Backend API runs at http://localhost:5220
Run as Desktop App
bashnpm run dev:electron
Demo Accounts
RoleEmailPasswordAdministratoradmin@mandela.ac.zapasswordProject Managerpm@mandela.ac.zapasswordSystems Analysttask@mandela.ac.zapasswordWeb Developerdev@mandela.ac.zapassword
Project Structure
techtask-hub/
├── src/              # React frontend components
├── electron.js       # Electron main process
├── preload.js        # Electron preload script
├── launch.js         # Dev launcher for Electron
├── server.js         # Express backend + API routes
├── database.sqlite   # SQLite database
├── package.json      # Project config and scripts
└── vite.config.js    # Vite configuration
API Endpoints
MethodEndpointDescriptionPOST/api/auth/loginUser loginGET/api/projectsGet all projectsPOST/api/projectsCreate projectGET/api/tasksGet all tasksPOST/api/tasksCreate taskGET/healthHealth check
Author
Nishal — github.com/nishal-1
