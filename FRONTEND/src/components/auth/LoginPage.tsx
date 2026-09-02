import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import './login.css';

const ROLES: Record<UserRole, { label: string; placeholder: string; autocomplete: string; pattern: RegExp; error: string }> = {
  admin: { label: 'Username :', placeholder: 'Enter your username', autocomplete: 'username', pattern: /^[a-zA-Z0-9._-]{3,32}$/, error: 'Enter a valid username (3-32 characters).' },
  hod: { label: 'Employee ID :', placeholder: 'Enter your employee ID', autocomplete: 'username', pattern: /^[a-zA-Z0-9-]{3,20}$/, error: 'Enter a valid employee ID.' },
  faculty: { label: 'Employee ID :', placeholder: 'Enter your employee ID', autocomplete: 'username', pattern: /^[a-zA-Z0-9-]{3,20}$/, error: 'Enter a valid employee ID.' },
  student: { label: 'Register Number :', placeholder: 'Enter your register number', autocomplete: 'username', pattern: /^[a-zA-Z0-9]{5,20}$/, error: 'Enter a valid register number.' },
};

const REMEMBER_KEY = 'college-login-remember';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [status, setStatus] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null');
      if (saved && ROLES[saved.role as UserRole]) {
        setSelectedRole(saved.role);
        setIdentifier(saved.id || '');
        setRemember(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const role = ROLES[selectedRole];
    let ok = true;

    setIdentifierError('');
    setPasswordError('');
    setStatus('');

    if (!role.pattern.test(identifier)) {
      setIdentifierError(role.error);
      ok = false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      ok = false;
    }
    if (!ok) return;

    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ role: selectedRole, id: identifier }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* storage unavailable */
    }

    login(selectedRole);
  };

  const role = ROLES[selectedRole];

  return (
    <div className="login-page">
      <section className="card" aria-labelledby="login-title">
        <header className="card__head">
          <img className="logo" src="/assets/tn-emblem.png" alt="Tamil Nadu Government emblem" />
          <p className="college-name">Government Arts &amp; Science College</p>
          <p className="college-sub">Affiliated to the University · Estd. 1965</p>
          <h1 className="card__title" id="login-title">Login to your account</h1>
        </header>

        <form className="form" onSubmit={handleLogin} noValidate>
          {/* Login As */}
          <div className="field">
            <label className="label" htmlFor="loginAs">Login As :</label>
            <div className="select-wrap">
              <select
                className="control select"
                id="loginAs"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                required
              >
                <option value="admin">Admin</option>
                <option value="hod">HOD</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
              </select>
              <svg className="icon icon--chevron" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Dynamic identifier field */}
          <div className="field">
            <label className="label" htmlFor="identifier">{role.label}</label>
            <input
              className="control"
              type="text"
              id="identifier"
              placeholder={role.placeholder}
              autoComplete={role.autocomplete}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            {identifierError && <p className="error" role="alert">{identifierError}</p>}
          </div>

          {/* Password */}
          <div className="field">
            <label className="label" htmlFor="password">Password :</label>
            <div className="input-wrap">
              <input
                className="control"
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="2.9" fill="none" stroke="currentColor" strokeWidth="1.9" />
                </svg>
              </button>
            </div>
            {passwordError && <p className="error" role="alert">{passwordError}</p>}
          </div>

          <div className="row">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <button type="button" className="link" onClick={() => setForgotOpen(true)}>
              Forgot Password?
            </button>
          </div>

          <button className="btn" type="submit">Login</button>
          {status && <p className="status" role="status">{status}</p>}
        </form>

        <footer className="card__foot">
          <span className="pill">Don't have an account? <a className="link" href="#signup">Sign Up now</a></span>
        </footer>
      </section>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
};
