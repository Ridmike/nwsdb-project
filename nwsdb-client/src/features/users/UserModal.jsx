import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Input/Select';
import { Modal } from '../../components/Modal/Modal';
import { createUser, updateUser } from '../../services/userService';
import { ROLES } from '../../utils/roles';

export function UserModal({ user = null, departments = [], onClose, onSaved }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'staff',
    section: user?.section || '',
    office: user?.office || 'Head Office',
    active: user?.active !== false
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.displayName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!isEdit) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError('Enter a valid email address.');
        return;
      }
      if (form.password.length < 6) {
        setError('Temporary password must be at least 6 characters.');
        return;
      }
    }

    setSaving(true);
    try {
      const saved = isEdit
        ? await updateUser(user.uid, {
            displayName: form.displayName,
            role: form.role,
            section: form.section,
            office: form.office,
            active: form.active
          })
        : await createUser({
            displayName: form.displayName,
            email: form.email,
            password: form.password,
            role: form.role,
            section: form.section,
            office: form.office
          });
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Could not save the user account.');
    } finally {
      setSaving(false);
    }
  }

  const activeDepartments = departments.filter((department) => department.active !== false);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit staff account' : 'Add a staff account'}
      subtitle={
        isEdit
          ? `Update the role and posting details for ${user.displayName}.`
          : 'The user signs in with their email address. Share the temporary password securely.'
      }
      size="md"
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField label="Full name" id="user-name" required className="form-grid__full">
            <Input
              id="user-name"
              value={form.displayName}
              onChange={(event) => setField('displayName', event.target.value)}
              placeholder="e.g. Nimal Perera"
              disabled={saving}
            />
          </FormField>

          <FormField label="Email address" id="user-email" required>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              placeholder="name@nwsdb.lk"
              disabled={saving || isEdit}
            />
          </FormField>

          {!isEdit && (
            <FormField label="Temporary password" id="user-password" required>
              <Input
                id="user-password"
                type="text"
                value={form.password}
                onChange={(event) => setField('password', event.target.value)}
                placeholder="At least 6 characters"
                disabled={saving}
              />
            </FormField>
          )}

          <FormField label="Role" id="user-role" required>
            <Select
              id="user-role"
              value={form.role}
              onChange={(event) => setField('role', event.target.value)}
              disabled={saving}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Section / division" id="user-section">
            <Select
              id="user-section"
              value={form.section}
              onChange={(event) => setField('section', event.target.value)}
              disabled={saving}
            >
              <option value="">Not assigned</option>
              {activeDepartments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
              {form.section && !activeDepartments.some((item) => item.name === form.section) && (
                <option value={form.section}>{form.section}</option>
              )}
            </Select>
          </FormField>

          <FormField label="Office" id="user-office">
            <Input
              id="user-office"
              value={form.office}
              onChange={(event) => setField('office', event.target.value)}
              placeholder="e.g. Head Office"
              disabled={saving}
            />
          </FormField>

          {isEdit && (
            <label className="nwsdb-checkbox form-grid__full">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setField('active', event.target.checked)}
                disabled={saving}
              />
              Account is active and can sign in
            </label>
          )}
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEdit ? 'Save changes' : 'Create account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default UserModal;
