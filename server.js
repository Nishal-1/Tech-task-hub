const express = require("express");
const cors = require("cors");
const path = require("path");

// Use built-in sqlite module (Node.js 22+)
let DatabaseSync;
try {
  const sqlite = require("node:sqlite");
  DatabaseSync = sqlite.DatabaseSync;
} catch (e) {
  console.log("⚠️  Node.js sqlite module not available. Using fallback...");
  // Fallback: You need to install better-sqlite3 or sqlite3
  try {
    const Database = require("better-sqlite3");
    DatabaseSync = class {
      constructor(path) {
        this.db = new Database(path);
      }
      exec(sql) {
        this.db.exec(sql);
      }
      prepare(sql) {
        const stmt = this.db.prepare(sql);
        return {
          get: (...args) => stmt.get(...args),
          all: (...args) => stmt.all(...args),
          run: (...args) => stmt.run(...args),
        };
      }
    };
  } catch (e2) {
    console.error("❌ Neither node:sqlite nor better-sqlite3 available");
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5220;

// ── Middleware ───────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5220"] }));
app.use(express.json());

// ── Database Setup (SQLite) ─────────────────────────────
const dbPath = path.join(__dirname, "database.sqlite");
const db = new DatabaseSync(dbPath);

try {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
} catch (e) {
  console.log("⚠️  PRAGMA commands not fully supported, continuing...");
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS Employees (
    EmployeeId  INTEGER PRIMARY KEY AUTOINCREMENT,
    Name        TEXT NOT NULL,
    Surname     TEXT NOT NULL,
    JobTitle    TEXT NOT NULL,
    Email       TEXT NOT NULL,
    Password    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Projects (
    ProjectId     INTEGER PRIMARY KEY AUTOINCREMENT,
    ProjectName   TEXT NOT NULL,
    ProjectStatus TEXT NOT NULL,
    ProjectDesc   TEXT NOT NULL,
    StartDate     TEXT NOT NULL,
    EndDate       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Tasks (
    TaskId                INTEGER PRIMARY KEY AUTOINCREMENT,
    TaskName              TEXT NOT NULL,
    TaskDesc              TEXT NOT NULL,
    TaskStatus            TEXT NOT NULL DEFAULT 'To Start',
    AssignedTime          TEXT NOT NULL,
    CompletedTime         TEXT NOT NULL,
    AssignedToEmployeeId  INTEGER NOT NULL,
    ProjectId             INTEGER NOT NULL,
    FOREIGN KEY (AssignedToEmployeeId) REFERENCES Employees(EmployeeId) ON DELETE RESTRICT,
    FOREIGN KEY (ProjectId) REFERENCES Projects(ProjectId) ON DELETE CASCADE
  );
`);

// ── Seed default users if table is empty ────────────────
try {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM Employees").get();
  if (count.cnt === 0) {
    const insert = db.prepare(
      "INSERT INTO Employees (Name, Surname, JobTitle, Email, Password) VALUES (?, ?, ?, ?, ?)"
    );
    insert.run("Admin", "User", "Administrator", "admin@mandela.ac.za", "admin123");
    insert.run("Task", "Manager", "Systems Analyst", "task@mandela.ac.za", "task123");
    insert.run("Project", "Manager", "Project Manager", "pm@mandela.ac.za", "pm123");
    insert.run("Web", "Developer", "Web Developer", "dev@mandela.ac.za", "dev123");
    console.log("✅ Seeded default employees");
  }
} catch (e) {
  console.log("⚠️  Could not seed data, continuing...");
}

// ══════════════════════════════════════════════════════════
// Helper: Convert row keys from PascalCase (DB) to camelCase (JSON)
// ══════════════════════════════════════════════════════════
function toCamel(row) {
  if (!row) return row;
  const out = {};
  for (const key of Object.keys(row)) {
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    out[camel] = row[key];
  }
  return out;
}

function toCamelArray(rows) {
  return rows.map(toCamel);
}

// ══════════════════════════════════════════════════════════
//  AUTH ROUTES  —  POST /api/auth/login & /api/auth/logout
// ══════════════════════════════════════════════════════════
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  try {
    const employee = db
      .prepare("SELECT * FROM Employees WHERE Email = ? AND Password = ?")
      .get(email, password);

    if (!employee) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({
      message: "Login successful",
      employeeId: employee.EmployeeId,
      name: employee.Name,
      jobTitle: employee.JobTitle,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.json({ message: "Logout successful" });
});

// ══════════════════════════════════════════════════════════
//  ADMIN ROUTES  —  /api/admin/*
// ══════════════════════════════════════════════════════════

// Create employee
app.post("/api/admin/create-employee", (req, res) => {
  const { name, surname, jobTitle, email, password } = req.body;
  if (!name || !surname || !jobTitle || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    db.prepare(
      "INSERT INTO Employees (Name, Surname, JobTitle, Email, Password) VALUES (?, ?, ?, ?, ?)"
    ).run(name, surname, jobTitle, email, password);
    res.json({ message: "Employee created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// Update employee
app.put("/api/admin/update-employee/:id", (req, res) => {
  const { name, surname, email, password, jobTitle } = req.body;
  try {
    const emp = db.prepare("SELECT * FROM Employees WHERE EmployeeId = ?").get(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    db.prepare(
      "UPDATE Employees SET Name=?, Surname=?, Email=?, Password=?, JobTitle=? WHERE EmployeeId=?"
    ).run(name, surname, email, password, jobTitle, req.params.id);
    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// Delete employee
app.delete("/api/admin/delete-employee/:id", (req, res) => {
  try {
    const emp = db.prepare("SELECT * FROM Employees WHERE EmployeeId = ?").get(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    db.prepare("DELETE FROM Employees WHERE EmployeeId = ?").run(req.params.id);
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// Get all employees
app.get("/api/admin/employees", (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM Employees").all();
    res.json(toCamelArray(rows));
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// Get employee by name
app.get("/api/admin/get-employee-by-name", (req, res) => {
  const { name } = req.query;
  try {
    const row = db
      .prepare("SELECT * FROM Employees WHERE LOWER(Name) = LOWER(?)")
      .get(name);
    res.json(toCamel(row) || null);
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// Get employee by email
app.get("/api/admin/get-employee-by-email", (req, res) => {
  const { email } = req.query;
  try {
    const row = db
      .prepare("SELECT * FROM Employees WHERE LOWER(Email) = LOWER(?)")
      .get(email);
    res.json(toCamel(row) || null);
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// ══════════════════════════════════════════════════════════
//  PROJECT MANAGER ROUTES  —  /api/projectmanager/*
// ══════════════════════════════════════════════════════════

// ── Projects ─────────────────────────────────────────────
app.post("/api/projectmanager/create-project", (req, res) => {
  const { projectName, projectStatus, projectDesc, startDate, endDate } = req.body;
  if (!projectName || !projectStatus || !projectDesc || !startDate || !endDate) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    db.prepare(
      "INSERT INTO Projects (ProjectName, ProjectStatus, ProjectDesc, StartDate, EndDate) VALUES (?, ?, ?, ?, ?)"
    ).run(projectName, projectStatus, projectDesc, startDate, endDate);
    res.json({ message: "Project created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.get("/api/projectmanager/get-projects", (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM Projects").all();
    res.json(toCamelArray(rows));
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.get("/api/projectmanager/get-project/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM Projects WHERE ProjectId = ?").get(req.params.id);
    if (!row) return res.status(404).json({ message: "Project not found" });
    res.json(toCamel(row));
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.put("/api/projectmanager/update-project/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM Projects WHERE ProjectId = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ message: "Project not found" });

    const { projectName, projectStatus, projectDesc, startDate, endDate } = req.body;
    db.prepare(
      "UPDATE Projects SET ProjectName=?, ProjectStatus=?, ProjectDesc=?, StartDate=?, EndDate=? WHERE ProjectId=?"
    ).run(projectName, projectStatus, projectDesc, startDate, endDate, req.params.id);
    res.json({ message: "Project updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.delete("/api/projectmanager/delete-project/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM Projects WHERE ProjectId = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ message: "Project not found" });

    db.prepare("DELETE FROM Projects WHERE ProjectId = ?").run(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// ── Tasks ────────────────────────────────────────────────
app.post("/api/projectmanager/create-task", (req, res) => {
  const { taskName, taskDesc, taskStatus, assignedTime, completedTime, assignedToEmployeeId, projectId } = req.body;
  if (!taskName || !taskDesc || !assignedToEmployeeId || !projectId) {
    return res.status(400).json({ message: "Required fields missing" });
  }
  try {
    db.prepare(
      "INSERT INTO Tasks (TaskName, TaskDesc, TaskStatus, AssignedTime, CompletedTime, AssignedToEmployeeId, ProjectId) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(taskName, taskDesc, taskStatus || "To Start", assignedTime || "", completedTime || "", assignedToEmployeeId, projectId);
    res.json({ message: "Task created and assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.get("/api/projectmanager/get-tasks", (_req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM Tasks").all();
    res.json(toCamelArray(rows));
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.get("/api/projectmanager/get-task/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM Tasks WHERE TaskId = ?").get(req.params.id);
    if (!row) return res.status(404).json({ message: "Task not found" });
    res.json(toCamel(row));
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.get("/api/projectmanager/get-tasks-by-status/:status", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM Tasks WHERE TaskStatus = ?").all(req.params.status);
    res.json(toCamelArray(rows));
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.get("/api/projectmanager/get-tasks-by-employee/:employeeId", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM Tasks WHERE AssignedToEmployeeId = ?")
      .all(req.params.employeeId);
    res.json(toCamelArray(rows));
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.put("/api/projectmanager/update-task/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM Tasks WHERE TaskId = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ message: "Task not found" });

    const { taskName, taskDesc, taskStatus, assignedTime, completedTime, assignedToEmployeeId, projectId } = req.body;
    db.prepare(
      "UPDATE Tasks SET TaskName=?, TaskDesc=?, TaskStatus=?, AssignedTime=?, CompletedTime=?, AssignedToEmployeeId=?, ProjectId=? WHERE TaskId=?"
    ).run(
      taskName ?? existing.TaskName,
      taskDesc ?? existing.TaskDesc,
      taskStatus ?? existing.TaskStatus,
      assignedTime ?? existing.AssignedTime,
      completedTime ?? existing.CompletedTime,
      assignedToEmployeeId ?? existing.AssignedToEmployeeId,
      projectId ?? existing.ProjectId,
      req.params.id
    );
    res.json({ message: "Task updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

app.delete("/api/projectmanager/delete-task/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM Tasks WHERE TaskId = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ message: "Task not found" });

    db.prepare("DELETE FROM Tasks WHERE TaskId = ?").run(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// ── Health Check ─────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "✅ Server is running", port: PORT });
});

// ── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 TechTask Hub API running at http://localhost:${PORT}`);
  console.log(`📦 Database: ${dbPath}`);
  console.log(`📝 Health Check: http://localhost:${PORT}/health\n`);
});
