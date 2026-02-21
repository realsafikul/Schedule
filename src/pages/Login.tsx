import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Lock, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center mt-5">
      <div className="col-md-4">
        <div className="card border-0 shadow-lg rounded-4">
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div className="bg-primary text-white rounded-circle d-inline-flex p-3 mb-3">
                <Lock size={32} />
              </div>
              <h3 className="fw-black">Admin Access</h3>
              <p className="text-muted small">Enter your credentials to manage the roster</p>
            </div>

            {error && <div className="alert alert-danger small py-2">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><Mail size={18} className="text-muted" /></span>
                  <input 
                    type="email" 
                    className="form-control bg-light border-start-0" 
                    placeholder="admin@saltsync.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary text-uppercase tracking-wider">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><Lock size={18} className="text-muted" /></span>
                  <input 
                    type="password" 
                    className="form-control bg-light border-start-0" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full py-3 fw-bold rounded-3 shadow-sm"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
