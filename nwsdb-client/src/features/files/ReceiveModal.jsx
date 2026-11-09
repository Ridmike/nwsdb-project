import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { Textarea } from '../../components/Input/Textarea';
import { Modal } from '../../components/Modal/Modal';
import { receiveMovement } from '../../services/fileService';
import { toDateTimeInput } from '../../utils/format';

export function ReceiveModal({ file, movement, onClose, onSaved }) {
  const [receiptAt, setReceiptAt] = useState(toDateTimeInput(new Date()));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const updated = await receiveMovement(file.id, movement.id, { receiptAt, notes });
      onSaved(updated);
    } catch (err) {
      setError(err.message || 'Could not confirm receipt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Confirm receipt"
      subtitle={`Confirm that ${file.reference} physically arrived with ${movement.toName}.`}
      size="md"
    >
      <p className="form-note">
        Confirming receipt records a separate timestamp from the handover. The file will be assigned
        to the recipient immediately.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField label="Receipt date and time" id="receipt-at" required className="form-grid__full">
            <Input
              id="receipt-at"
              type="datetime-local"
              value={receiptAt}
              onChange={(event) => setReceiptAt(event.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormField label="Receipt notes" id="receipt-notes" className="form-grid__full">
            <Textarea
              id="receipt-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes about the condition of the file or missing documents."
              disabled={saving}
            />
          </FormField>
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            Confirm receipt
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ReceiveModal;
