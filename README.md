Here's the web-only README:

TechTask Hub
A full-stack project and task management platform with role-based access control, built with React, Node.js, Express, and SQLite.
Features

Role-based access control across 4 user types: Admin, Project Manager, Systems Analyst, and Web Developer
Each role gets a dedicated dashboard with role-specific permissions
Project creation, assignment, and tracking
Task management with status updates
Secure authentication system
SQLite database with no external DB dependency

Tech Stack
Frontend: React, Vite, Bootstrap
Backend: Node.js, Express
Database: SQLite
Auth: Session-based authentication
Getting Started
Prerequisites

Node.js v18+
npm

Installation
bashgit clone https://github.com/nishal-1/techtask-hub
cd techtask-hub
npm install
Running the App
bashnpm run dev
Frontend runs at http://localhost:3000
Backend API runs at http://localhost:5220
Demo Accounts
RoleEmailPasswordAdministratoradmin@mandela.ac.zapasswordProject Managerpm@mandela.ac.zapasswordSystems Analysttask@mandela.ac.zapasswordWeb Developerdev@mandela.ac.zapassword
Project Structure
techtask-hub/
├── src/              # React frontend components
├── server.js         # Express backend + API routes
├── database.sqlite   # SQLite database
├── package.json      # Project config and scripts
└── vite.config.js    # Vite configuration
API Endpoints
MethodEndpointDescriptionPOST/api/auth/loginUser loginGET/api/projectsGet all projectsPOST/api/projectsCreate projectGET/api/tasksGet all tasksPOST/api/tasksCreate taskGET/healthHealth check
Author
Nishal — github.com/nishal-1
