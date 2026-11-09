import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { Modal } from '../../components/Modal/Modal';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyAuthError } from '../../services/authService';

export function ForgotPasswordModal({ onClose, defaultEmail = '' }) {
  const { sendReset } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Enter the username used for your staff account.');
      return;
    }

    setSubmitting(true);
    try {
      await sendReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Reset your password"
      subtitle="We will email you a secure password reset link"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!sent && (
            <Button
              type="submit"
              form="forgot-password-form"
              variant="primary"
              isLoading={submitting}
            >
              Send reset link
            </Button>
          )}
        </>
      }
    >
      {sent ? (
        <div className="forgot-password__success" role="status">
          <span className="forgot-password__success-icon" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>Check your email</strong>
            <p>
              If an account exists for <strong>{email.trim()}</strong>, a password reset link has
              been sent. Follow the link in the email to choose a new password.
            </p>
          </div>
        </div>
      ) : (
        <form id="forgot-password-form" className="forgot-password" onSubmit={handleSubmit} noValidate>
          <p className="forgot-password__intro">
            Enter your staff username. A reset link will be sent to the email linked to that account.
          </p>

          {error && (
            <div className="login-alert login-alert--error" role="alert">
              {error}
            </div>
          )}

          <FormField label="Username or email" id="forgot-email" required>
            <Input
              id="forgot-email"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
          </FormField>

          <p className="forgot-password__hint">
            Still cannot sign in? Ask a system administrator to reset your password from User
            Management.
          </p>
        </form>
      )}
    </Modal>
  );
}

export default ForgotPasswordModal;
