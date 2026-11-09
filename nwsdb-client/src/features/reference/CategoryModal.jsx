import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Input/Select';
import { Modal } from '../../components/Modal/Modal';
import { createCategory, updateCategory } from '../../services/categoryService';

export function CategoryModal({ category = null, categories = [], onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState({
    name: category?.name || '',
    code: category?.code || '',
    parentId: category?.parentId || '',
    active: category?.active !== false
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
      setError('Category name is required.');
      return;
    }
    if (!form.code.trim()) {
      setError('Category code is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        parentId: form.parentId || null,
        active: form.active
      };
      const saved = isEdit
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Could not save the category.');
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = categories.filter(
    (item) => !item.parentId && item.id !== category?.id
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit error category' : 'Add an error category'}
      subtitle="Categories classify the complaint and drive the category breakdown in reports."
      size="md"
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField label="Category name" id="cat-name" required className="form-grid__full">
            <Input
              id="cat-name"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="e.g. Meter reading error"
              disabled={saving}
            />
          </FormField>

          <FormField label="Short code" id="cat-code" required>
            <Input
              id="cat-code"
              value={form.code}
              onChange={(event) => setField('code', event.target.value.toUpperCase())}
              placeholder="e.g. MTR"
              disabled={saving}
            />
          </FormField>

          <FormField label="Parent category (optional)" id="cat-parent">
            <Select
              id="cat-parent"
              value={form.parentId}
              onChange={(event) => setField('parentId', event.target.value)}
              disabled={saving}
            >
              <option value="">Main category</option>
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
              Category is active when registering new files
            </label>
          )}
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEdit ? 'Save changes' : 'Add category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryModal;
