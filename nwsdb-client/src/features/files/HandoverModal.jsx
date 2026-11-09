import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/Input/FormField';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Input/Select';
import { Textarea } from '../../components/Input/Textarea';
import { Modal } from '../../components/Modal/Modal';
import { useAuth } from '../../hooks/useAuth';
import { createMovement } from '../../services/fileService';
import { toDateTimeInput } from '../../utils/format';
import { getRoleShortLabel } from '../../utils/roles';

export function HandoverModal({ file, staff, departments, onClose, onSaved }) {
  const { user } = useAuth();
  const activeStaff = staff.filter(
    (person) => person.active !== false && person.uid !== user?.uid
  );

  const [toUid, setToUid] = useState(activeStaff[0]?.uid || '');
  const [type, setType] = useState('handover');
  const [handoverAt, setHandoverAt] = useState(toDateTimeInput(new Date()));
  const [notes, setNotes] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const recipient = staff.find((person) => person.uid === toUid);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!toUid) {
      setError('Select the person receiving the file.');
      return;
    }

    setSaving(true);
    try {
      const movement = await createMovement(file.id, {
        toUid,
        type,
        handoverAt,
        notes,
        delayReason
      });
      onSaved(movement);
    } catch (err) {
      setError(err.message || 'Could not record the handover.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Record a handover"
      subtitle={`Send ${file.reference} to the next officer or section.`}
      size="md"
    >
      {file.pendingMovementId && (
        <p className="form-note">
          A receipt is still pending for this file. Confirm the previous receipt before recording a
          new handover.
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField label="Handover type" id="handover-type">
            <Select
              id="handover-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              disabled={saving}
            >
              <option value="handover">Handover to next officer</option>
              <option value="return">Return for correction</option>
            </Select>
          </FormField>

          <FormField label="Handover date and time" id="handover-at" required>
            <Input
              id="handover-at"
              type="datetime-local"
              value={handoverAt}
              onChange={(event) => setHandoverAt(event.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormField label="Recipient" id="handover-recipient" required className="form-grid__full">
            <Select
              id="handover-recipient"
              value={toUid}
              onChange={(event) => setToUid(event.target.value)}
              disabled={saving || !activeStaff.length}
            >
              <option value="">Select a recipient</option>
              {activeStaff.map((person) => {
                const department = departments.find((item) => item.name === person.section);
                return (
                  <option key={person.uid} value={person.uid}>
                    {person.displayName} · {getRoleShortLabel(person.role)}
                    {department ? ` · ${department.name}` : person.section ? ` · ${person.section}` : ''}
                  </option>
                );
              })}
            </Select>
          </FormField>

          {recipient && (
            <p className="form-note form-grid__full">
              This will mark the file as awaiting receipt from {recipient.displayName}. The file is
              not considered received until the recipient confirms it.
            </p>
          )}

          <FormField label="Notes" id="handover-notes" className="form-grid__full">
            <Textarea
              id="handover-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Instructions or documents included with the file."
              disabled={saving}
            />
          </FormField>

          <FormField label="Reason for delay (if any)" id="handover-delay" className="form-grid__full">
            <Input
              id="handover-delay"
              value={delayReason}
              onChange={(event) => setDelayReason(event.target.value)}
              placeholder="Optional delay reason"
              disabled={saving}
            />
          </FormField>
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving} disabled={Boolean(file.pendingMovementId)}>
            Record handover
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default HandoverModal;
