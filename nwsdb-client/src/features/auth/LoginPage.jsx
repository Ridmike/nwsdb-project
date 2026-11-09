import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { isFirebaseConfigured } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyAuthError } from '../../services/authService';

import { ForgotPasswordModal } from './ForgotPasswordModal';
import './LoginPage.css';

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

export function LoginPage() {
  const { signIn, isAuthenticated, loading, isDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState(isDemo ? 'admin' : '');
  const [password, setPassword] = useState(isDemo ? 'demo1234' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Enter both your username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(username.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-brand-panel">
        <div className="login-brand-panel__inner">
          <div className="login-brand">
            <span className="login-brand__logo">
              <DropletIcon />
            </span>
            <div>
              <strong>NWSDB</strong>
              <span>National Water Supply &amp; Drainage Board</span>
            </div>
          </div>

          <div className="login-brand-panel__content">
            <p className="login-brand-panel__eyebrow">Internal staff system</p>
            <h1>File Tracking &amp; Workflow Management</h1>
            <p>
              Track physical water bill adjustment files, record handovers and receipts, and see
              how long each file stays with every officer or section.
            </p>

            <ul className="login-brand-panel__features">
              <li>
                <span className="login-brand-panel__check">✓</span>
                Current file location and responsible officer
              </li>
              <li>
                <span className="login-brand-panel__check">✓</span>
                Handover, receipt and time-in-transit history
              </li>
              <li>
                <span className="login-brand-panel__check">✓</span>
                Delay monitoring for managers and Head Office
              </li>
            </ul>
          </div>

          <p className="login-brand-panel__footer">
            Authorised NWSDB staff only. All activity may be recorded for audit purposes.
          </p>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-panel__inner">
          <Card variant="elevated" className="login-card">
            <Card.Body>
              <div className="login-card__heading">
                <span className="login-card__eyebrow">Staff sign in</span>
                <h2>Welcome back</h2>
                <p>Sign in with your staff username and password.</p>
              </div>

              {isDemo ? (
                <div className="login-demo-note" role="status">
                  Demo mode is active. Use the prefilled account to preview the system.
                </div>
              ) : (
                !isFirebaseConfigured && (
                  <div className="login-alert login-alert--warning" role="status">
                    Firebase is not configured. Add your Firebase keys to{' '}
                    <code>nwsdb-client/.env</code> to enable sign in.
                  </div>
                )
              )}

              {error && (
                <div className="login-alert login-alert--error" role="alert">
                  {error}
                </div>
              )}

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                <FormField label="Username" id="login-username" required>
                  <Input
                    id="login-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    leftIcon={<UserIcon />}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Password" id="login-password" required>
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    leftIcon={<LockIcon />}
                    disabled={submitting}
                  />
                </FormField>

                <div className="login-form__options">
                  <label className="login-checkbox">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(event) => setShowPassword(event.target.checked)}
                    />
                    <span>Show password</span>
                  </label>

                  <button
                    type="button"
                    className="login-link"
                    onClick={() => setForgotOpen(true)}
                    disabled={submitting}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={submitting}
                >
                  Sign in
                </Button>
              </form>

              <p className="login-card__help">
                Need an account? Contact the system administrator.
              </p>
            </Card.Body>
          </Card>

          <p className="login-panel__footer">
            © {new Date().getFullYear()} National Water Supply &amp; Drainage Board
          </p>
        </div>
      </main>

      {forgotOpen && (
        <ForgotPasswordModal onClose={() => setForgotOpen(false)} defaultEmail={username} />
      )}
    </div>
  );
}

export default LoginPage;
