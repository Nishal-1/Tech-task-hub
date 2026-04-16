📌 Overview

TechTask Hub is a full-stack web application designed to manage and track tasks efficiently. It enables users to create, update, and monitor tasks in a structured way, improving productivity and workflow management.

✨ Features
📝 Create, update, and delete tasks
📊 Track task status (Pending, In Progress, Completed)
⚡ Fast and simple user interface
📦 Persistent storage using SQLite
🔄 RESTful API integration
🛠️ Tech Stack
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express
Database: SQLite
📂 Project Structure
TechTask Hub/
│── BackEnd-Node/
│   ├── server.js
│   ├── database.sqlite
│   └── routes/
│
│── FrontEnd/
│   ├── public/
│   │   └── index.html
│   └── assets/
│
│── package.json
🚀 Getting Started
🔹 Clone the repository
git clone https://github.com/your-username/TechTask-Hub.git
cd TechTask-Hub
🔹 Install dependencies
npm install
🔹 Run the backend
npm run dev

👉 Server runs at:

http://localhost:5220
🔹 Run the frontend
Open FrontEnd/public/index.html
Or use Live Server in VS Code
🔗 API Endpoints
Method	Endpoint	Description
GET	/tasks	Get all tasks
POST	/tasks	Create new task
PUT	/tasks/:id	Update task
DELETE	/tasks/:id	Delete task
📸 Screenshots

(Add your screenshots here)

⚠️ Notes
Backend must be running before frontend
Do not upload node_modules/
Ensure correct API URL in frontend
🎯 Future Improvements
🔐 Authentication (JWT)
🔔 Notifications
🎨 Better UI (React)
📱 Mobile responsive design
📄 License

This project is licensed under the MIT License

👨‍💻 Author

Muhammed Nishal

⭐ Support

If you like this project, give it a ⭐ on GitHub!
