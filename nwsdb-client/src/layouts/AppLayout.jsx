import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import {
  BuildingIcon,
  ChartIcon,
  CheckCircleIcon,
  DashboardIcon,
  DropletIcon,
  FileTextIcon,
  FolderIcon,
  LogOutIcon,
  MenuIcon,
  TagIcon,
  UsersIcon
} from '../components/Icons/Icons';
import { useAuth } from '../hooks/useAuth';
import { resetDemoData } from '../demo/store';
import { getInitials } from '../utils/format';
import {
  ROLES,
  canManageReferenceData,
  canManageUsers,
  canViewReports,
  getRoleLabel
} from '../utils/roles';
import './AppLayout.css';

const PRIMARY_NAV = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/files', label: 'Files', icon: FolderIcon },
  { to: '/approvals', label: 'Approvals', icon: CheckCircleIcon },
  { to: '/reports', label: 'Reports', icon: ChartIcon }
];

export function AppLayout() {
  const { user, role, isDemo, signOut, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = PRIMARY_NAV.filter(
    (item) => item.to !== '/reports' || canViewReports(role)
  );

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  function handleResetDemo() {
    resetDemoData();
    window.location.reload();
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className={`app-shell ${sidebarOpen ? 'app-shell--menu-open' : ''}`}>
      <button
        type="button"
        className="app-shell__scrim"
        aria-label="Close navigation"
        onClick={closeSidebar}
      />

      <aside className="app-sidebar">
        <Link to="/" className="app-sidebar__brand" onClick={closeSidebar}>
          <span className="app-sidebar__logo">
            <DropletIcon size={20} />
          </span>
          <span>
            <strong>NWSDB</strong>
            <small>File Tracking</small>
          </span>
        </Link>

        <nav className="app-sidebar__nav" aria-label="Main navigation">
          <span className="app-sidebar__section-label">Workspace</span>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`
                }
                onClick={closeSidebar}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {(canManageUsers(role) || canManageReferenceData(role)) && (
            <>
              <span className="app-sidebar__section-label">Administration</span>
              {canManageUsers(role) && (
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <UsersIcon size={18} />
                  <span>Staff accounts</span>
                </NavLink>
              )}
              {canManageReferenceData(role) && (
                <>
                  <NavLink
                    to="/admin/departments"
                    className={({ isActive }) =>
                      `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`
                    }
                    onClick={closeSidebar}
                  >
                    <BuildingIcon size={18} />
                    <span>Departments</span>
                  </NavLink>
                  <NavLink
                    to="/admin/categories"
                    className={({ isActive }) =>
                      `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`
                    }
                    onClick={closeSidebar}
                  >
                    <TagIcon size={18} />
                    <span>Error categories</span>
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        <div className="app-sidebar__footer">
          {isDemo && (
            <div className="app-sidebar__demo">
              <span>Demo workspace</span>
              <p>Sample data only. Nothing is saved to Firebase.</p>
              <button type="button" onClick={handleResetDemo}>
                Reset demo data
              </button>
            </div>
          )}
          <div className="app-sidebar__user">
            <span className="app-sidebar__avatar">{getInitials(user?.displayName, user?.email)}</span>
            <span className="app-sidebar__user-text">
              <strong>{user?.displayName || user?.email || 'Staff member'}</strong>
              <small>{getRoleLabel(role)}</small>
            </span>
          </div>
          <Button variant="ghost" size="sm" fullWidth icon={<LogOutIcon size={16} />} onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar__left">
            <button
              type="button"
              className="app-topbar__menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon size={20} />
            </button>
            <div className="app-topbar__title">
              <FileTextIcon size={18} />
              <span>Water Bill Adjustment File Tracking</span>
            </div>
          </div>

          <div className="app-topbar__right">
            {isDemo && (
              <label className="app-topbar__role-switcher">
                <span>Demo role</span>
                <select value={role || 'admin'} onChange={(event) => switchDemoRole(event.target.value)}>
                  {ROLES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.short}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="app-topbar__user">
              <span className="app-topbar__avatar">{getInitials(user?.displayName, user?.email)}</span>
              <span>
                <strong>{user?.displayName || 'Staff member'}</strong>
                <small>{getRoleLabel(role)}</small>
              </span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
