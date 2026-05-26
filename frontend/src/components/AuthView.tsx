import React, { useState, useEffect } from 'react';
import { Shield, Key, AlertCircle, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { AuthState } from '../types';
import { Alert, Panel } from './ui';

interface AuthViewProps {
  onAuthSuccess?: () => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const loadAuthStatus = () => setAuth(api.getAuth());

  useEffect(() => {
    loadAuthStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await api.register({ firstName, lastName, email, password });
        setSuccess('Registration successful. Please sign in.');
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const user = await api.login({ email, password });
        if (!api.getAuth().isAuthenticated) {
          throw new Error('Login succeeded but session was not stored.');
        }
        setSuccess(`Welcome back, ${user.firstName || 'there'}.`);
        setPassword('');
        loadAuthStatus();
        onAuthSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Check your API connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    loadAuthStatus();
    setSuccess('Signed out successfully.');
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {auth.isAuthenticated ? (
        <Panel padding="md" className="space-y-5 text-center">
          <div className="w-12 h-12 bg-surface-container-high text-text-primary rounded-full flex items-center justify-center mx-auto text-lg font-semibold">
            {(auth.user?.firstName?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary capitalize">
              {auth.user?.firstName} {auth.user?.lastName || ''}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">{auth.user?.email}</p>
          </div>
          <Alert variant="success" className="flex items-center justify-center gap-2 text-xs">
            <CheckCircle size={14} />
            Session active
          </Alert>
          <div className="divider pt-4 text-left space-y-2">
            <p className="label">Tokens</p>
            <div className="panel-elevated px-3 py-2 flex justify-between items-center text-xs">
              <span className="text-text-secondary">Access</span>
              <span className="badge-accent">Active</span>
            </div>
            <div className="panel-elevated px-3 py-2 flex justify-between items-center text-xs">
              <span className="text-text-secondary">Refresh</span>
              <span className="badge">Stored</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full btn-secondary text-error hover:text-error">
            <LogOut size={14} />
            Sign out
          </button>
        </Panel>
      ) : (
        <Panel padding="md" className="space-y-5">
          <div className="flex gap-1 bg-surface-container-high rounded-md p-0.5">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                !isRegister ? 'bg-surface-container-highest text-text-primary' : 'text-text-muted'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                isRegister ? 'bg-surface-container-highest text-text-primary' : 'text-text-muted'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <Alert variant="error" className="flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="flex items-start gap-2">
              <CheckCircle size={14} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="label">First name</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field" />
                </div>
                <div className="space-y-1">
                  <label className="label">Last name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field" />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="label">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
            <div className="space-y-1">
              <label className="label">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
            </div>
            {isRegister && (
              <div className="space-y-1">
                <label className="label">Confirm password</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full btn-primary">
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Please wait…
                </>
              ) : (
                <>
                  <Key size={14} />
                  {isRegister ? 'Create account' : 'Sign in'}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted pt-1">
            {!isRegister ? (
              <>
                New here?{' '}
                <button type="button" onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }} className="text-primary font-medium hover:underline cursor-pointer">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Have an account?{' '}
                <button type="button" onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }} className="text-primary font-medium hover:underline cursor-pointer">
                  Sign in
                </button>
              </>
            )}
          </p>
        </Panel>
      )}
    </div>
  );
}
