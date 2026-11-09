import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Input/Select';
import { Modal } from '../../components/Modal/Modal';
import { createApproval } from '../../services/approvalService';
import { ROLES, getRoleShortLabel } from '../../utils/roles';

export function ApprovalModal({ file, staff, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [assignedRole, setAssignedRole] = useState('oic');
  const [assignedUid, setAssignedUid] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const roleOptions = ROLES.filter((role) => role.value !== 'admin');
  const assignees = staff.filter(
    (person) => person.active !== false && person.role === assignedRole
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Enter a name for the approval step.');
      return;
    }

    setSaving(true);
    try {
      const approval = await createApproval(file.id, { title, assignedRole, assignedUid });
      onSaved(approval);
    } catch (err) {
      setError(err.message || 'Could not add the approval step.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add an approval step"
      subtitle={`Add a review or signature requirement for ${file.reference}.`}
      size="md"
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField label="Step title" id="approval-title" required className="form-grid__full">
            <Input
              id="approval-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Manager approval"
              disabled={saving}
            />
          </FormField>

          <FormField label="Assigned role" id="approval-role" required>
            <Select
              id="approval-role"
              value={assignedRole}
              onChange={(event) => {
                setAssignedRole(event.target.value);
                setAssignedUid('');
              }}
              disabled={saving}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Specific officer (optional)" id="approval-officer">
            <Select
              id="approval-officer"
              value={assignedUid}
              onChange={(event) => setAssignedUid(event.target.value)}
              disabled={saving || !assignees.length}
            >
              <option value="">Any officer with this role</option>
              {assignees.map((person) => (
                <option key={person.uid} value={person.uid}>
                  {person.displayName} · {getRoleShortLabel(person.role)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            Add approval step
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ApprovalModal;
