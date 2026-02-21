import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Lock, Mail, UserPlus, Trash2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase Auth not initialized. Check your configuration.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/operation-not-allowed') {
        msg = "Email/Password login is not enabled in your Firebase Console. Go to Authentication > Sign-in method and enable it.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearConfig = () => {
    if (window.confirm('Are you sure you want to clear your Firebase configuration?')) {
      localStorage.removeItem('SALTSYNC_FIREBASE_CONFIG');
      window.location.reload();
    }
  };

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-5">
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div className="bg-primary text-white rounded-circle d-inline-flex p-3 mb-3">
                {isRegistering ? <UserPlus size={32} /> : <Lock size={32} />}
              </div>
              <h3 className="fw-black">{isRegistering ? 'Create Admin Account' : 'Admin Access'}</h3>
              <p className="text-muted small">
                {isRegistering 
                  ? 'Set up your first administrator account' 
                  : 'Enter your credentials to manage the roster'}
              </p>
            </div>

            {error && (
              <div className="alert alert-danger small py-2 d-flex align-items-center gap-2">
                <div className="flex-grow-1">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Email Address</label>
                <div className="input-group shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-white border-end-0"><Mail size={18} className="text-muted" /></span>
                  <input 
                    type="email" 
                    className="form-control border-start-0 py-2" 
                    placeholder="admin@saltsync.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Password</label>
                <div className="input-group shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-white border-end-0"><Lock size={18} className="text-muted" /></span>
                  <input 
                    type="password" 
                    className="form-control border-start-0 py-2" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {isRegistering && <div className="form-text x-small text-muted mt-1">Minimum 6 characters required.</div>}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm mb-3 transition-all"
                disabled={loading}
              >
                {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
              </button>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <button 
                  type="button" 
                  className="btn btn-link btn-sm text-decoration-none text-secondary fw-bold p-0"
                  onClick={() => setIsRegistering(!isRegistering)}
                >
                  {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Create Admin'}
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-link btn-sm text-danger text-decoration-none p-0 d-flex align-items-center gap-1"
                  onClick={clearConfig}
                >
                  <Trash2 size={14} /> Reset Config
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-light p-4 border-top">
            <p className="small text-muted mb-0 text-center">
              <strong>Note:</strong> You must enable <strong>Email/Password</strong> in your Firebase Console under <em>Authentication &gt; Sign-in method</em> for this to work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
