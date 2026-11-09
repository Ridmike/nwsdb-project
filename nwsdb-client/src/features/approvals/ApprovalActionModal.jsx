import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Textarea } from '../../components/Input/Textarea';
import { Modal } from '../../components/Modal/Modal';
import { updateApproval } from '../../services/approvalService';

export function ApprovalActionModal({ file, approval, action, onClose, onSaved }) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isReturn = action === 'returned';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (isReturn && !comment.trim()) {
      setError('Add a reason when returning the file.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateApproval(file.id, approval.id, { status: action, comment });
      onSaved(updated);
    } catch (err) {
      setError(err.message || 'Could not update the approval.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isReturn ? 'Return for correction' : 'Approve step'}
      subtitle={`${approval.title} · ${file.reference}`}
      size="sm"
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label={isReturn ? 'Reason for return' : 'Comment (optional)'}
          id="approval-comment"
          required={isReturn}
        >
          <Textarea
            id="approval-comment"
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={
              isReturn
                ? 'Explain what needs to be corrected before the file can be approved.'
                : 'Optional approval note.'
            }
            disabled={saving}
          />
        </FormField>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isReturn ? 'danger' : 'success'}
            isLoading={saving}
          >
            {isReturn ? 'Return file' : 'Approve'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ApprovalActionModal;
