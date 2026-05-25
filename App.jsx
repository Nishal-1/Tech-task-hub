import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5220';

/* ═══════════════════════════════════════════════
   IPC HOOK — communicates with the Electron main process
   Uses window.electronAPI exposed by preload.js
═══════════════════════════════════════════════ */
function useElectronIPC() {
  const [appInfo, setAppInfo] = useState(null);
  const [updateMsg, setUpdateMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  // Fetch app info once on mount
  useEffect(() => {
    if (!isElectron) return;
    window.electronAPI.getAppInfo().then(setAppInfo).catch(() => { });

    // Listen for updater push events
    window.electronAPI.onUpdateAvailable?.((info) =>
      setUpdateMsg(`🎉 Update v${info.version} available!`)
    );
    window.electronAPI.onUpToDate?.(() =>
      setUpdateMsg('✅ You are on the latest version.')
    );
    window.electronAPI.onUpdateError?.((msg) =>
      setUpdateMsg(`⚠️ Update error: ${msg}`)
    );

    return () => {
      window.electronAPI.removeAllListeners?.('updater:update-available');
      window.electronAPI.removeAllListeners?.('updater:up-to-date');
      window.electronAPI.removeAllListeners?.('updater:error');
    };
  }, [isElectron]);

  const checkForUpdate = useCallback(async () => {
    if (!isElectron) return;
    setChecking(true);
    setUpdateMsg('');
    try {
      const result = await window.electronAPI.checkForUpdate();
      if (result.available) {
        setUpdateMsg(`🎉 Update v${result.version} is available!`);
      } else {
        setUpdateMsg(result.reason || '✅ You are on the latest version.');
      }
    } catch {
      setUpdateMsg('⚠️ Could not check for updates.');
    } finally {
      setChecking(false);
    }
  }, [isElectron]);

  // IPC demo: show a native OS dialog
  const showNativeDialog = useCallback(async () => {
    if (!isElectron) {
      alert('Native dialog is only available inside Electron.');
      return;
    }
    await window.electronAPI.showMessage(
      'IPC Demo',
      `Hello from Electron main process!\n\nApp: ${appInfo?.name ?? 'TechTask Hub'}\nVersion: ${appInfo?.version ?? '1.0.0'}\nPlatform: ${appInfo?.platform ?? 'unknown'}`
    );
  }, [isElectron, appInfo]);

  return { isElectron, appInfo, updateMsg, checking, checkForUpdate, showNativeDialog };
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const statusBadge = (status) => {
  const map = {
    'Active': 'badge badge-emerald',
    'On Hold': 'badge badge-amber',
    'Completed': 'badge badge-indigo',
    'To Start': 'badge badge-cyan',
    'In Progress': 'badge badge-purple',
    'Done': 'badge badge-emerald',
    'Administrator': 'badge badge-rose',
    'Project Manager': 'badge badge-indigo',
    'Systems Analyst': 'badge badge-purple',
    'Web Developer': 'badge badge-cyan',
  };
  return map[status] || 'badge badge-indigo';
};

/* ═══════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════ */
const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@mandela.ac.za');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      onLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { label: 'Administrator', email: 'admin@mandela.ac.za', pass: 'admin123' },
    { label: 'Project Manager', email: 'pm@mandela.ac.za', pass: 'pm123' },
    { label: 'Systems Analyst', email: 'task@mandela.ac.za', pass: 'task123' },
    { label: 'Web Developer', email: 'dev@mandela.ac.za', pass: 'dev123' },
  ];

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-icon">⚡</div>
            <h1>TechTask Hub</h1>
            <p>Project & Task Management Platform</p>
          </div>

          {error && (
            <div className="alert-error">
              <i className="fa fa-circle-exclamation"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                placeholder="name@company.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              className="btn-primary-grad"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', marginTop: '4px' }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginRight: 8 }}></span> Signing in…</>
                : <><i className="fa fa-bolt"></i> Sign In</>}
            </button>
          </form>

          <hr className="login-divider" />

          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Demo Accounts
          </p>
          <div className="credentials-grid">
            {demoCredentials.map((c) => (
              <button
                key={c.email}
                className="cred-item"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                onClick={() => { setEmail(c.email); setPassword(c.pass); }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <strong style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{c.label}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
const Sidebar = ({ user, activeTab, setActiveTab, onLogout, counts, ipc }) => {
  const isAdmin = user.jobTitle === 'Administrator';

  const adminNav = [
    { id: 'employees', icon: '👥', label: 'Employees', count: counts.employees },
  ];

  const pmNav = [
    { id: 'projects', icon: '📁', label: 'Projects', count: counts.projects },
    { id: 'tasks', icon: '✅', label: 'Tasks', count: counts.tasks },
  ];

  const navItems = isAdmin ? adminNav : pmNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div className="sidebar-logo-text">
          <h1>TechTask Hub</h1>
          <span>Management Platform</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{getInitials(user.name)}</div>
        <div className="user-info">
          <h4>{user.name}</h4>
          <span>{user.jobTitle}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <div
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <div className="nav-icon">{item.icon}</div>
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="nav-badge">{item.count}</span>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* ── IPC Demo Panel ── */}
        {ipc && (
          <div className="ipc-panel" id="ipc-panel">
            <div className="ipc-panel-header">
              <span className="ipc-panel-dot"></span>
              <span className="ipc-panel-label">
                {ipc.isElectron ? 'Electron' : 'Browser'} Mode
              </span>
            </div>

            {ipc.appInfo && (
              <div className="ipc-info-row">
                <span>v{ipc.appInfo.version}</span>
                <span className="badge badge-cyan" style={{ fontSize: 10, padding: '2px 7px' }}>
                  {ipc.appInfo.platform}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                id="ipc-native-dialog-btn"
                className="btn-ipc"
                onClick={ipc.showNativeDialog}
                title="IPC Demo: Show native OS dialog"
              >
                💬 IPC Dialog
              </button>
              <button
                id="ipc-update-btn"
                className="btn-ipc"
                onClick={ipc.checkForUpdate}
                disabled={ipc.checking}
                title="Check for app updates"
              >
                {ipc.checking ? '⏳' : '🔄'} Update
              </button>
            </div>

            {ipc.updateMsg && (
              <div className="ipc-update-msg">{ipc.updateMsg}</div>
            )}
          </div>
        )}

        <button className="logout-btn" onClick={onLogout} id="logout-btn">
          <i className="fa fa-arrow-right-from-bracket"></i> Sign Out
        </button>
      </div>
    </aside>
  );
};

/* ═══════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════ */
const AdminDashboard = ({ user, onLogout, ipc }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const [formData, setFormData] = useState({
    name: '', surname: '', jobTitle: '', email: '', password: '',
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/employees`);
      setEmployees(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/api/admin/create-employee`, formData);
      setFlash('Employee created successfully!');
      setFormData({ name: '', surname: '', jobTitle: '', email: '', password: '' });
      setShowModal(false);
      fetchEmployees();
      setTimeout(() => setFlash(''), 3000);
    } catch (err) {
      setFlash('Error: ' + (err.response?.data?.message || 'Failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    try {
      await axios.delete(`${API}/api/admin/delete-employee/${id}`);
      setFlash(`${name} removed successfully.`);
      fetchEmployees();
      setTimeout(() => setFlash(''), 3000);
    } catch (err) {
      setFlash('Error: ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const counts = { employees: employees.length };

  return (
    <div className="app-shell">
      <Sidebar user={user} activeTab="employees" setActiveTab={() => { }} onLogout={onLogout} counts={counts} ipc={ipc} />

      <main className="main-content">
        {/* ── Topbar ── */}
        <div className="topbar">
          <div className="topbar-title">
            <h2>👥 Employee Management</h2>
            <p>Manage all team members and their roles</p>
          </div>
          <div className="topbar-actions">
            <div className="status-pill">
              <div className="status-dot"></div> Live
            </div>
            <button id="add-employee-btn" className="btn-primary-grad" onClick={() => setShowModal(true)}>
              <i className="fa fa-plus"></i> Add Employee
            </button>
          </div>
        </div>

        <div className="page-content">
          {/* Flash */}
          {flash && (
            <div className={flash.startsWith('Error') ? 'alert-error' : 'alert-success'} style={{ marginBottom: 20 }}>
              <i className={`fa ${flash.startsWith('Error') ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
              {flash}
            </div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card delay-1">
              <div className="stat-icon indigo"><i className="fa fa-users"></i></div>
              <div className="stat-info">
                <h3>{employees.length}</h3>
                <p>Total Employees</p>
              </div>
            </div>
            <div className="stat-card delay-2">
              <div className="stat-icon rose"><i className="fa fa-crown"></i></div>
              <div className="stat-info">
                <h3>{employees.filter(e => e.jobTitle === 'Administrator').length}</h3>
                <p>Administrators</p>
              </div>
            </div>
            <div className="stat-card delay-3">
              <div className="stat-icon cyan"><i className="fa fa-code"></i></div>
              <div className="stat-info">
                <h3>{employees.filter(e => e.jobTitle === 'Web Developer').length}</h3>
                <p>Developers</p>
              </div>
            </div>
            <div className="stat-card delay-4">
              <div className="stat-icon emerald"><i className="fa fa-chart-line"></i></div>
              <div className="stat-info">
                <h3>{employees.filter(e => e.jobTitle === 'Project Manager').length}</h3>
                <p>Project Managers</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h4><i className="fa fa-table" style={{ marginRight: 8, color: 'var(--accent-1)' }}></i> All Employees</h4>
              <span className="badge badge-indigo">{employees.length} records</span>
            </div>
            {loading ? (
              <div className="spinner-wrap"><div className="spinner"></div> Loading employees…</div>
            ) : employees.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h4>No employees yet</h4>
                <p>Add your first employee to get started.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Job Title</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, i) => (
                      <tr key={emp.employeeId}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                            }}>
                              {getInitials(`${emp.name} ${emp.surname}`)}
                            </div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {emp.name} {emp.surname}
                            </span>
                          </div>
                        </td>
                        <td>{emp.email}</td>
                        <td><span className={statusBadge(emp.jobTitle)}>{emp.jobTitle}</span></td>
                        <td>
                          <button
                            className="btn-danger-sm"
                            onClick={() => handleDelete(emp.employeeId, `${emp.name} ${emp.surname}`)}
                          >
                            <i className="fa fa-trash"></i> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Create Employee Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3><i className="fa fa-user-plus" style={{ marginRight: 10, color: 'var(--accent-1)' }}></i> New Employee</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" type="text" placeholder="John" value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" type="text" placeholder="Doe" value={formData.surname}
                    onChange={e => setFormData({ ...formData, surname: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="john@company.com" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <select className="form-select" value={formData.jobTitle}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} required>
                    <option value="">Select role…</option>
                    <option>Administrator</option>
                    <option>Project Manager</option>
                    <option>Systems Analyst</option>
                    <option>Web Developer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn-primary-grad" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Creating…' : <><i className="fa fa-plus"></i> Create Employee</>}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   PROJECT MANAGER DASHBOARD
═══════════════════════════════════════════════ */
const ProjectManagerDashboard = ({ user, onLogout, ipc }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const [projectForm, setProjectForm] = useState({
    projectName: '', projectStatus: 'Active', projectDesc: '', startDate: '', endDate: '',
  });
  const [taskForm, setTaskForm] = useState({
    taskName: '', taskDesc: '', taskStatus: 'To Start', assignedToEmployeeId: '', projectId: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pr, tk, em] = await Promise.all([
        axios.get(`${API}/api/projectmanager/get-projects`),
        axios.get(`${API}/api/projectmanager/get-tasks`),
        axios.get(`${API}/api/admin/employees`),
      ]);
      setProjects(pr.data);
      setTasks(tk.data);
      setEmployees(em.data);
    } finally {
      setLoading(false);
    }
  };

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const handleCreateProject = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await axios.post(`${API}/api/projectmanager/create-project`, projectForm);
      setProjectForm({ projectName: '', projectStatus: 'Active', projectDesc: '', startDate: '', endDate: '' });
      setShowProjectModal(false);
      fetchData();
      showFlash('Project created successfully!');
    } catch (err) { showFlash('Error: ' + err.response?.data?.message); }
    finally { setSaving(false); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await axios.post(`${API}/api/projectmanager/create-task`, taskForm);
      setTaskForm({ taskName: '', taskDesc: '', taskStatus: 'To Start', assignedToEmployeeId: '', projectId: '' });
      setShowTaskModal(false);
      fetchData();
      showFlash('Task created and assigned!');
    } catch (err) { showFlash('Error: ' + err.response?.data?.message); }
    finally { setSaving(false); }
  };

  const handleDeleteProject = async (id, name) => {
    if (!window.confirm(`Delete project "${name}"? All tasks will be removed too.`)) return;
    try {
      await axios.delete(`${API}/api/projectmanager/delete-project/${id}`);
      fetchData(); showFlash('Project deleted.');
    } catch (err) { showFlash('Error: ' + err.response?.data?.message); }
  };

  const handleDeleteTask = async (id, name) => {
    if (!window.confirm(`Delete task "${name}"?`)) return;
    try {
      await axios.delete(`${API}/api/projectmanager/delete-task/${id}`);
      fetchData(); showFlash('Task deleted.');
    } catch (err) { showFlash('Error: ' + err.response?.data?.message); }
  };

  const counts = { projects: projects.length, tasks: tasks.length };

  const statusCount = (status) => tasks.filter(t => t.taskStatus === status).length;

  return (
    <div className="app-shell">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} counts={counts} ipc={ipc} />

      <main className="main-content">
        {/* ── Topbar ── */}
        <div className="topbar">
          <div className="topbar-title">
            {activeTab === 'projects'
              ? <><h2>📁 Projects</h2><p>Manage and track all your projects</p></>
              : <><h2>✅ Tasks</h2><p>Assign and track task progress</p></>}
          </div>
          <div className="topbar-actions">
            <div className="status-pill">
              <div className="status-dot"></div> Live
            </div>
            {activeTab === 'projects' && (
              <button id="add-project-btn" className="btn-primary-grad" onClick={() => setShowProjectModal(true)}>
                <i className="fa fa-plus"></i> New Project
              </button>
            )}
            {activeTab === 'tasks' && (
              <button id="add-task-btn" className="btn-primary-grad" onClick={() => setShowTaskModal(true)}>
                <i className="fa fa-plus"></i> New Task
              </button>
            )}
          </div>
        </div>

        <div className="page-content">
          {/* Flash */}
          {flash && (
            <div className={flash.startsWith('Error') ? 'alert-error' : 'alert-success'} style={{ marginBottom: 20 }}>
              <i className={`fa ${flash.startsWith('Error') ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
              {flash}
            </div>
          )}

          {/* ── PROJECTS TAB ── */}
          {activeTab === 'projects' && (
            <>
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card delay-1">
                  <div className="stat-icon indigo"><i className="fa fa-folder-open"></i></div>
                  <div className="stat-info"><h3>{projects.length}</h3><p>Total Projects</p></div>
                </div>
                <div className="stat-card delay-2">
                  <div className="stat-icon emerald"><i className="fa fa-circle-play"></i></div>
                  <div className="stat-info"><h3>{projects.filter(p => p.projectStatus === 'Active').length}</h3><p>Active</p></div>
                </div>
                <div className="stat-card delay-3">
                  <div className="stat-icon amber"><i className="fa fa-pause-circle"></i></div>
                  <div className="stat-info"><h3>{projects.filter(p => p.projectStatus === 'On Hold').length}</h3><p>On Hold</p></div>
                </div>
                <div className="stat-card delay-4">
                  <div className="stat-icon cyan"><i className="fa fa-circle-check"></i></div>
                  <div className="stat-info"><h3>{projects.filter(p => p.projectStatus === 'Completed').length}</h3><p>Completed</p></div>
                </div>
              </div>

              {loading ? (
                <div className="spinner-wrap"><div className="spinner"></div> Loading projects…</div>
              ) : projects.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📁</div>
                  <h4>No projects yet</h4>
                  <p>Click "New Project" to create your first project.</p>
                </div>
              ) : (
                <div className="project-grid">
                  {projects.map((p, i) => (
                    <div key={p.projectId} className="project-card" style={{ animationDelay: `${i * 0.06}s` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span className={statusBadge(p.projectStatus)}>{p.projectStatus}</span>
                        <button
                          className="btn-danger-sm"
                          onClick={() => handleDeleteProject(p.projectId, p.projectName)}
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                      <h3 className="project-card-title">{p.projectName}</h3>
                      <p className="project-card-desc">{p.projectDesc}</p>
                      <div className="project-card-meta">
                        <span className="project-date">
                          <i className="fa fa-calendar" style={{ color: 'var(--accent-1)' }}></i>
                          {p.startDate}
                        </span>
                        <span className="project-date">
                          <i className="fa fa-flag" style={{ color: 'var(--accent-2)' }}></i>
                          {p.endDate}
                        </span>
                        <span className="badge badge-indigo" style={{ fontSize: 11 }}>
                          {tasks.filter(t => t.projectId === p.projectId).length} tasks
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TASKS TAB ── */}
          {activeTab === 'tasks' && (
            <>
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card delay-1">
                  <div className="stat-icon indigo"><i className="fa fa-list-check"></i></div>
                  <div className="stat-info"><h3>{tasks.length}</h3><p>Total Tasks</p></div>
                </div>
                <div className="stat-card delay-2">
                  <div className="stat-icon cyan"><i className="fa fa-hourglass-start"></i></div>
                  <div className="stat-info"><h3>{statusCount('To Start')}</h3><p>To Start</p></div>
                </div>
                <div className="stat-card delay-3">
                  <div className="stat-icon purple"><i className="fa fa-spinner"></i></div>
                  <div className="stat-info"><h3>{statusCount('In Progress')}</h3><p>In Progress</p></div>
                </div>
                <div className="stat-card delay-4">
                  <div className="stat-icon emerald"><i className="fa fa-circle-check"></i></div>
                  <div className="stat-info"><h3>{statusCount('Done')}</h3><p>Done</p></div>
                </div>
              </div>

              {loading ? (
                <div className="spinner-wrap"><div className="spinner"></div> Loading tasks…</div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <h4>No tasks yet</h4>
                  <p>Click "New Task" to assign the first task.</p>
                </div>
              ) : (
                <div className="glass-card">
                  <div className="glass-card-header">
                    <h4><i className="fa fa-list" style={{ marginRight: 8, color: 'var(--accent-1)' }}></i> All Tasks</h4>
                    <span className="badge badge-indigo">{tasks.length} records</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Task</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th>Project</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task, i) => {
                          const emp = employees.find(e => e.employeeId === task.assignedToEmployeeId);
                          const proj = projects.find(p => p.projectId === task.projectId);
                          return (
                            <tr key={task.taskId}>
                              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</td>
                              <td>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{task.taskName}</div>
                                  <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.taskDesc}</div>
                                </div>
                              </td>
                              <td><span className={statusBadge(task.taskStatus)}>{task.taskStatus}</span></td>
                              <td>
                                {emp ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      width: 28, height: 28, borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
                                    }}>
                                      {getInitials(`${emp.name} ${emp.surname}`)}
                                    </div>
                                    {emp.name} {emp.surname}
                                  </div>
                                ) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                              </td>
                              <td>
                                {proj
                                  ? <span className="badge badge-purple" style={{ fontSize: 11 }}>{proj.projectName}</span>
                                  : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                              </td>
                              <td>
                                <button className="btn-danger-sm" onClick={() => handleDeleteTask(task.taskId, task.taskName)}>
                                  <i className="fa fa-trash"></i> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Create Project Modal ── */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowProjectModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3><i className="fa fa-folder-plus" style={{ marginRight: 10, color: 'var(--accent-1)' }}></i> New Project</h3>
              <button className="modal-close" onClick={() => setShowProjectModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input className="form-input" type="text" placeholder="e.g. Website Redesign" value={projectForm.projectName}
                  onChange={e => setProjectForm({ ...projectForm, projectName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Describe the project goals and scope…" value={projectForm.projectDesc}
                  onChange={e => setProjectForm({ ...projectForm, projectDesc: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={projectForm.projectStatus}
                    onChange={e => setProjectForm({ ...projectForm, projectStatus: e.target.value })}>
                    <option>Active</option>
                    <option>On Hold</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="date" value={projectForm.startDate}
                    onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input className="form-input" type="date" value={projectForm.endDate}
                  onChange={e => setProjectForm({ ...projectForm, endDate: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn-primary-grad" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Creating…' : <><i className="fa fa-plus"></i> Create Project</>}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowProjectModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Task Modal ── */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3><i className="fa fa-circle-plus" style={{ marginRight: 10, color: 'var(--accent-2)' }}></i> New Task</h3>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Name</label>
                <input className="form-input" type="text" placeholder="e.g. Design landing page" value={taskForm.taskName}
                  onChange={e => setTaskForm({ ...taskForm, taskName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Describe what needs to be done…" value={taskForm.taskDesc}
                  onChange={e => setTaskForm({ ...taskForm, taskDesc: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Assign to Project</label>
                  <select className="form-select" value={taskForm.projectId}
                    onChange={e => setTaskForm({ ...taskForm, projectId: e.target.value })} required>
                    <option value="">Select project…</option>
                    {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.projectName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to Employee</label>
                  <select className="form-select" value={taskForm.assignedToEmployeeId}
                    onChange={e => setTaskForm({ ...taskForm, assignedToEmployeeId: e.target.value })} required>
                    <option value="">Select employee…</option>
                    {employees.map(e => <option key={e.employeeId} value={e.employeeId}>{e.name} {e.surname}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={taskForm.taskStatus}
                  onChange={e => setTaskForm({ ...taskForm, taskStatus: e.target.value })}>
                  <option>To Start</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn-primary-grad" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? 'Creating…' : <><i className="fa fa-plus"></i> Create Task</>}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════ */
function App() {
  const [user, setUser] = useState(null);
  const ipc = useElectronIPC();

  const handleLogout = async () => {
    try { await axios.post(`${API}/api/auth/logout`); } catch { }
    setUser(null);
  };

  if (!user) return <Login onLoginSuccess={setUser} />;

  if (user.jobTitle === 'Administrator')
    return <AdminDashboard user={user} onLogout={handleLogout} ipc={ipc} />;

  return <ProjectManagerDashboard user={user} onLogout={handleLogout} ipc={ipc} />;
}

export default App;
