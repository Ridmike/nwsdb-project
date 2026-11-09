import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Input/Select';
import { Modal } from '../../components/Modal/Modal';
import { createDepartment, updateDepartment } from '../../services/departmentService';

export function DepartmentModal({ department = null, departments = [], onClose, onSaved }) {
  const isEdit = Boolean(department);
  const [form, setForm] = useState({
    name: department?.name || '',
    code: department?.code || '',
    type: department?.type || 'section',
    parentId: department?.parentId || '',
    active: department?.active !== false
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Department name is required.');
      return;
    }
    if (!form.code.trim()) {
      setError('Department code is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        type: form.type,
        parentId: form.parentId || null,
        active: form.active
      };
      const saved = isEdit
        ? await updateDepartment(department.id, payload)
        : await createDepartment(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Could not save the department.');
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = departments.filter((item) => item.id !== department?.id);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit department' : 'Add a department'}
      subtitle="Departments and sections are used for file routing, handover records, and reports."
      size="md"
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField label="Department name" id="dept-name" required className="form-grid__full">
            <Input
              id="dept-name"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="e.g. Consumer Relations"
              disabled={saving}
            />
          </FormField>

          <FormField label="Short code" id="dept-code" required>
            <Input
              id="dept-code"
              value={form.code}
              onChange={(event) => setField('code', event.target.value.toUpperCase())}
              placeholder="e.g. CRC"
              disabled={saving}
            />
          </FormField>

          <FormField label="Type" id="dept-type" required>
            <Select
              id="dept-type"
              value={form.type}
              onChange={(event) => setField('type', event.target.value)}
              disabled={saving}
            >
              <option value="division">Division</option>
              <option value="section">Section</option>
              <option value="office">Office</option>
              <option value="unit">Unit</option>
            </Select>
          </FormField>

          <FormField label="Parent department (optional)" id="dept-parent" className="form-grid__full">
            <Select
              id="dept-parent"
              value={form.parentId}
              onChange={(event) => setField('parentId', event.target.value)}
              disabled={saving}
            >
              <option value="">Standalone department</option>
              {parentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>

          {isEdit && (
            <label className="nwsdb-checkbox form-grid__full">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setField('active', event.target.checked)}
                disabled={saving}
              />
              Department is active and available for routing
            </label>
          )}
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEdit ? 'Save changes' : 'Add department'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default DepartmentModal;
