import React, { useState } from 'react';
import { useShift } from './context/ShiftContext';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import { LayoutDashboard, BarChart3, LogIn, LogOut, Globe, ShieldAlert, Settings, AlertTriangle } from 'lucide-react';
import { auth, isConfigured } from './firebase';
import { signOut } from 'firebase/auth';

export default function App() {
  const { user, loading, isEmergencyMode, setEmergencyMode } = useShift();
  const [currentView, setCurrentView] = useState<'public' | 'admin' | 'analytics'>('public');
  const [configInput, setConfigInput] = useState('');

  const handleLogout = () => {
    if (auth) signOut(auth);
    setCurrentView('public');
  };

  const saveConfig = () => {
    if (!configInput.trim()) return;
    localStorage.setItem('SALTSYNC_FIREBASE_CONFIG', configInput.trim());
    window.location.reload();
  };

  if (!isConfigured) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
        <div className="card border-0 shadow-lg rounded-4 p-5 text-center" style={{ maxWidth: '600px' }}>
          <div className="bg-primary bg-opacity-10 text-primary p-4 rounded-circle d-inline-flex mb-4">
            <Settings size={48} />
          </div>
          <h2 className="fw-black mb-3">Welcome to SaltSync</h2>
          <p className="text-muted mb-4">
            To get started, please paste your Firebase Configuration below. This is a one-time setup.
          </p>
          
          <div className="mb-4">
            <textarea 
              className="form-control font-monospace small rounded-3 bg-light border-0" 
              rows={8}
              placeholder={`Paste your config here, for example:\n\nconst firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  ...\n};`}
              value={configInput}
              onChange={(e) => setConfigInput(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm mb-3" 
            onClick={saveConfig}
            disabled={!configInput.trim()}
          >
            Save & Initialize System
          </button>

          <div className="d-flex gap-2 mb-3">
            <button 
              className="btn btn-outline-secondary w-100 py-2 small fw-bold rounded-3"
              onClick={() => {
                localStorage.setItem('SALTSYNC_DEMO_MODE', 'true');
                window.location.reload();
              }}
            >
              Try Demo Mode (No Setup)
            </button>
            <button 
              className="btn btn-link btn-sm text-danger text-decoration-none"
              onClick={() => {
                localStorage.removeItem('SALTSYNC_FIREBASE_CONFIG');
                localStorage.removeItem('SALTSYNC_DEMO_MODE');
                window.location.reload();
              }}
            >
              Clear
            </button>
          </div>

          <div className="bg-light p-3 rounded-3 text-start small">
            <p className="fw-bold mb-2 text-primary d-flex align-items-center gap-2">
              <ShieldAlert size={16} /> Where to find this?
            </p>
            <p className="mb-0 text-muted">
              Go to your <strong>Firebase Console</strong> &gt; <strong>Project Settings</strong>. 
              Scroll down to "Your apps", select the Web icon (<code>&lt;/&gt;</code>), and copy the <code>firebaseConfig</code> object.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-muted">Initializing SaltSync Enterprise...</h5>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Dynamic Banner for Notices */}
      <NoticeBanner />

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
        <div className="container-fluid px-4">
          <a className="navbar-brand d-flex align-items-center gap-2" href="#" onClick={() => setCurrentView('public')}>
            <div className="bg-primary rounded p-1">
              <Settings size={20} className="text-white" />
            </div>
            <span className="fw-bold tracking-tighter">SALTSYNC <span className="fw-light text-secondary">ENTERPRISE</span></span>
          </a>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link border-0 ${currentView === 'public' ? 'active' : ''}`}
                  onClick={() => setCurrentView('public')}
                >
                  <Globe size={18} className="me-1" /> Public View
                </button>
              </li>
              {user && (
                <>
                  <li className="nav-item">
                    <button 
                      className={`nav-link btn btn-link border-0 ${currentView === 'admin' ? 'active' : ''}`}
                      onClick={() => setCurrentView('admin')}
                    >
                      <LayoutDashboard size={18} className="me-1" /> Dashboard
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link btn btn-link border-0 ${currentView === 'analytics' ? 'active' : ''}`}
                      onClick={() => setCurrentView('analytics')}
                    >
                      <BarChart3 size={18} className="me-1" /> Analytics
                    </button>
                  </li>
                </>
              )}
            </ul>

            <div className="d-flex align-items-center gap-3">
              {user && user.role === 'admin' && (
                <div className="form-check form-switch text-danger me-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={isEmergencyMode} 
                    onChange={(e) => setEmergencyMode(e.target.checked)}
                  />
                  <label className="form-check-label small fw-bold text-white">EMERGENCY</label>
                </div>
              )}
              
              {user ? (
                <div className="dropdown">
                  <button className="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                    <div className="bg-secondary rounded-circle" style={{ width: 24, height: 24 }}></div>
                    <span className="small">{user.email}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow">
                    <li><button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleLogout}><LogOut size={16} /> Logout</button></li>
                  </ul>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm px-3 fw-bold" onClick={() => setCurrentView('admin')}>
                  <LogIn size={16} className="me-1" /> Admin Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4 px-4">
        {currentView === 'admin' && !user ? (
          <Login onLogin={() => setCurrentView('admin')} />
        ) : currentView === 'admin' ? (
          <Dashboard />
        ) : currentView === 'analytics' ? (
          <Analytics />
        ) : (
          <Dashboard isPublic={true} />
        )}
      </div>
    </div>
  );
}

function NoticeBanner() {
  const { notices } = useShift();
  const activeNotice = notices.find(n => n.active);

  if (!activeNotice) return null;

  const priorityColors = {
    low: 'bg-info',
    medium: 'bg-warning',
    high: 'bg-danger'
  };

  return (
    <div className={`${priorityColors[activeNotice.priority]} text-white text-center py-2 px-3 fw-bold small shadow-sm`}>
      <span className="me-2">📢</span>
      {activeNotice.title}: {activeNotice.description}
    </div>
  );
}
