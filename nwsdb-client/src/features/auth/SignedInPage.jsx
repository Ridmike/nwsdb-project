import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { useAuth } from '../../hooks/useAuth';
import { getRoleLabel } from '../../utils/roles';
import './SignedInPage.css';

export function SignedInPage() {
  const { user, role, claims, isDemo, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="signed-in-page">
      <Card variant="elevated" className="signed-in-card">
        <Card.Body>
          <span className="signed-in-card__badge">Login successful</span>
          <h1>Welcome, {user?.displayName || user?.email || 'NWSDB Staff'}</h1>
          <p>
            The login interface is working. The after-login file tracking screens will be connected
            from your friend&apos;s branch.
          </p>

          <dl className="signed-in-card__details">
            <div>
              <dt>Username / email</dt>
              <dd>{user?.email || '—'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{getRoleLabel(role)}</dd>
            </div>
            {claims.section && (
              <div>
                <dt>Section</dt>
                <dd>{claims.section}</dd>
              </div>
            )}
            {claims.office && (
              <div>
                <dt>Office</dt>
                <dd>{claims.office}</dd>
              </div>
            )}
          </dl>

          {isDemo && (
            <p className="signed-in-card__demo">Demo mode — no Firebase connection used.</p>
          )}

          <Button variant="primary" onClick={handleSignOut}>
            Sign out
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}

export default SignedInPage;
