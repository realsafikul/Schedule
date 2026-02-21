import React, { useState } from 'react';
import { useShift } from './context/ShiftContext';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import { LayoutDashboard, BarChart3, LogIn, LogOut, Globe, ShieldAlert, Settings } from 'lucide-react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export default function App() {
  const { user, loading, isEmergencyMode, setEmergencyMode } = useShift();
  const [currentView, setCurrentView] = useState<'public' | 'admin' | 'analytics'>('public');

  const handleLogout = () => {
    signOut(auth);
    setCurrentView('public');
  };

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
