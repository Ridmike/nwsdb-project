import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isDemoMode, isFirebaseConfigured } from '../firebase/config';
import {
  getClaims,
  loginWithEmail,
  logout as logoutService,
  sendReset as sendResetService,
  toLoginEmail
} from '../services/authService';
import { ROLE_LABELS } from '../utils/roles';
import { AuthContext } from './auth-context';

const DEMO_SESSION_KEY = 'nwsdb-demo-session';

function readDemoSession() {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    isDemoMode ? readDemoSession()?.user ?? null : null
  );
  const [claims, setClaims] = useState(() =>
    isDemoMode ? readDemoSession()?.claims ?? {} : {}
  );
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || isDemoMode) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setClaims({});
        setLoading(false);
        return;
      }

      try {
        const nextClaims = await getClaims(nextUser);
        if (nextClaims.active === false) {
          await logoutService();
          setUser(null);
          setClaims({});
          setLoading(false);
          return;
        }
        setUser(nextUser);
        setClaims(nextClaims);
      } catch {
        setUser(nextUser);
        setClaims({});
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (isDemoMode) {
      if (!email.trim() || !password) {
        throw new Error('Enter both your username and password.');
      }

      const demoUser = {
        uid: 'demo-admin',
        email: toLoginEmail(email),
        displayName: 'Demo Administrator',
        metadata: { lastSignInTime: new Date().toISOString() }
      };
      const demoClaims = {
        role: 'admin',
        active: true,
        section: 'IT Division',
        office: 'Head Office'
      };

      sessionStorage.setItem(
        DEMO_SESSION_KEY,
        JSON.stringify({ user: demoUser, claims: demoClaims })
      );
      setUser(demoUser);
      setClaims(demoClaims);
      return demoUser;
    }

    const credential = await loginWithEmail(toLoginEmail(email), password);
    const nextClaims = await getClaims(credential.user, true);

    if (nextClaims.active === false) {
      await logoutService();
      throw new Error('This account has been disabled. Please contact the system administrator.');
    }

    return credential.user;
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      setClaims({});
      return;
    }

    await logoutService();
  }, []);

  const sendReset = useCallback(async (email) => {
    if (isDemoMode) {
      return;
    }

    await sendResetService(toLoginEmail(email));
  }, []);

  const switchDemoRole = useCallback((nextRole) => {
    if (!isDemoMode) {
      return;
    }

    const session = readDemoSession();
    if (!session?.user) {
      return;
    }

    const nextUser = {
      ...session.user,
      displayName: `Demo ${ROLE_LABELS[nextRole] || nextRole}`
    };
    const nextClaims = { ...session.claims, role: nextRole };

    sessionStorage.setItem(
      DEMO_SESSION_KEY,
      JSON.stringify({ user: nextUser, claims: nextClaims })
    );
    setUser(nextUser);
    setClaims(nextClaims);
  }, []);

  const value = useMemo(
    () => ({
      user,
      claims,
      loading,
      role: claims.role || (user ? 'staff' : null),
      isAdmin: claims.role === 'admin',
      isAuthenticated: Boolean(user),
      isDemo: isDemoMode,
      signIn,
      signOut,
      sendReset,
      switchDemoRole
    }),
    [user, claims, loading, signIn, signOut, sendReset, switchDemoRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
