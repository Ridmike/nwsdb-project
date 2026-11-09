import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Input/Select';
import { Textarea } from '../../components/Input/Textarea';
import { Modal } from '../../components/Modal/Modal';
import { createFile, updateFile } from '../../services/fileService';
import { toDateInput } from '../../utils/format';

function emptyForm(file) {
  return {
    complaintNo: file?.complaintNo || '',
    consumerName: file?.consumerName || '',
    consumerPhone: file?.consumerPhone || '',
    consumerAddress: file?.consumerAddress || '',
    billMonth: file?.billMonth || '',
    billAmount: file?.billAmount ?? '',
    adjustmentAmount: file?.adjustmentAmount ?? '',
    categoryId: file?.categoryId || '',
    subCategoryId: file?.subCategoryId || '',
    description: file?.description || '',
    priority: file?.priority || 'normal',
    dueDate: toDateInput(file?.dueDate)
  };
}

export function CreateFileModal({ file = null, categories = [], onClose, onSaved }) {
  const isEdit = Boolean(file);
  const [form, setForm] = useState(() => emptyForm(file));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const mainCategories = categories.filter((category) => !category.parentId && category.active !== false);
  const subCategories = categories.filter(
    (category) => category.parentId === form.categoryId && category.active !== false
  );

  function setField(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'categoryId') {
        next.subCategoryId = '';
      }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.consumerName.trim()) {
      setError('Consumer name is required.');
      return;
    }
    if (!form.categoryId) {
      setError('Select an error category.');
      return;
    }
    if (!form.description.trim()) {
      setError('Add a short description of the complaint.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        billAmount: Number(form.billAmount) || 0,
        adjustmentAmount: Number(form.adjustmentAmount) || 0
      };
      const saved = isEdit ? await updateFile(file.id, payload) : await createFile(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Could not save the file.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit file details' : 'Register a new file'}
      subtitle={
        isEdit
          ? `Update the complaint details for ${file.reference}.`
          : 'Create the physical file record and register the complaint.'
      }
      size="lg"
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid form-grid--three">
          <FormField label="Complaint number" id="file-complaint">
            <Input
              id="file-complaint"
              value={form.complaintNo}
              onChange={(event) => setField('complaintNo', event.target.value)}
              placeholder="e.g. C-2026-0210"
              disabled={saving}
            />
          </FormField>

          <FormField label="Billing month" id="file-bill-month">
            <Input
              id="file-bill-month"
              type="month"
              value={form.billMonth}
              onChange={(event) => setField('billMonth', event.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormField label="Priority" id="file-priority">
            <Select
              id="file-priority"
              value={form.priority}
              onChange={(event) => setField('priority', event.target.value)}
              disabled={saving}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </Select>
          </FormField>

          <FormField label="Consumer name" id="file-consumer" required>
            <Input
              id="file-consumer"
              value={form.consumerName}
              onChange={(event) => setField('consumerName', event.target.value)}
              placeholder="Full name"
              disabled={saving}
            />
          </FormField>

          <FormField label="Phone number" id="file-phone">
            <Input
              id="file-phone"
              value={form.consumerPhone}
              onChange={(event) => setField('consumerPhone', event.target.value)}
              placeholder="07X XXX XXXX"
              disabled={saving}
            />
          </FormField>

          <FormField label="Due date" id="file-due-date">
            <Input
              id="file-due-date"
              type="date"
              value={form.dueDate}
              onChange={(event) => setField('dueDate', event.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormField label="Address" id="file-address" className="form-grid__full">
            <Input
              id="file-address"
              value={form.consumerAddress}
              onChange={(event) => setField('consumerAddress', event.target.value)}
              placeholder="Consumer address"
              disabled={saving}
            />
          </FormField>

          <FormField label="Bill amount (LKR)" id="file-bill-amount">
            <Input
              id="file-bill-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.billAmount}
              onChange={(event) => setField('billAmount', event.target.value)}
              placeholder="0.00"
              disabled={saving}
            />
          </FormField>

          <FormField label="Requested adjustment (LKR)" id="file-adjustment">
            <Input
              id="file-adjustment"
              type="number"
              min="0"
              step="0.01"
              value={form.adjustmentAmount}
              onChange={(event) => setField('adjustmentAmount', event.target.value)}
              placeholder="0.00"
              disabled={saving}
            />
          </FormField>

          <FormField label="Main category" id="file-category" required>
            <Select
              id="file-category"
              value={form.categoryId}
              onChange={(event) => setField('categoryId', event.target.value)}
              disabled={saving}
            >
              <option value="">Select a category</option>
              {mainCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Subcategory" id="file-subcategory">
            <Select
              id="file-subcategory"
              value={form.subCategoryId}
              onChange={(event) => setField('subCategoryId', event.target.value)}
              disabled={saving || !subCategories.length}
            >
              <option value="">Not specified</option>
              {subCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Complaint description" id="file-description" required className="form-grid__full">
            <Textarea
              id="file-description"
              rows={3}
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="Describe the billing issue and what needs to be checked."
              disabled={saving}
            />
          </FormField>
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEdit ? 'Save changes' : 'Register file'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateFileModal;
