import { useState } from 'react';
import {
  Button,
  Card,
  StatusBadge,
  StatusIndicator,
  Input,
  FormField,
  Modal,
  Timeline,
  TimelineItem,
  Table,
  TableCell
} from './components';
import './App.css';

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseFilter, setCaseFilter] = useState('');

  // Sample case items for preview
  const sampleCases = [
    {
      id: 'NWSDB-COL-2026-0042',
      consumerName: 'K. S. Perera',
      category: 'Meter Reading Error',
      holder: 'Commercial Officer (CO)',
      section: 'Billing & Commercial',
      status: 'pending_review',
      timeHeld: '2d 4h'
    },
    {
      id: 'NWSDB-COL-2026-0038',
      consumerName: 'M. T. Fernando',
      category: 'Pipe Leakage Adjustment',
      holder: 'Area Engineer (AE)',
      section: 'Operations & Maintenance',
      status: 'delayed',
      timeHeld: '5d 1h'
    },
    {
      id: 'NWSDB-COL-2026-0029',
      consumerName: 'A. R. Silva',
      category: 'Faulty Tariff Category',
      holder: 'In Transit to RSC Officer',
      section: 'Regional Support Center',
      status: 'handed_over',
      timeHeld: '3h (Transit)'
    },
    {
      id: 'NWSDB-COL-2026-0015',
      consumerName: 'D. M. Jayasinghe',
      category: 'Estimated Bill Correction',
      holder: 'Completed',
      section: 'Consumer Relations (CRC)',
      status: 'completed',
      timeHeld: 'Resolved'
    }
  ];

  return (
    <div className="nwsdb-showcase">
      {/* Header */}
      <header className="nwsdb-showcase__header">
        <div className="nwsdb-showcase__brand">
          <div className="nwsdb-showcase__logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <div className="nwsdb-showcase__title-area">
            <h1>NWSDB File Tracking & Workflow Design System</h1>
            <p>Reusable Enterprise Components for Water Bill Adjustment Case Tracking</p>
          </div>
        </div>
        <div className="nwsdb-showcase__component-row">
          <StatusIndicator status="active" label="System Operational" />
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Handover Modal Demo
          </Button>
        </div>
      </header>

      {/* 1. Dashboard Metric Cards */}
      <section>
        <h2 className="nwsdb-showcase__section-title">
          1. Metric Cards <span className="nwsdb-showcase__tag">&lt;Card&gt;</span>
        </h2>
        <div className="nwsdb-showcase__stats-grid">
          <Card variant="elevated">
            <Card.Header>
              <Card.Title subtitle="Under active investigation">Total Open Cases</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="nwsdb-showcase__stat-num">128</div>
              <div className="nwsdb-showcase__stat-sub">Across 6 regional sections</div>
            </Card.Body>
          </Card>

          <Card variant="elevated">
            <Card.Header>
              <Card.Title subtitle="Dispatched, awaiting arrival">In Transit / Handed Over</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="nwsdb-showcase__stat-num" style={{ color: 'var(--color-warning-solid)' }}>
                14
              </div>
              <div className="nwsdb-showcase__stat-sub">Awaiting recipient confirmation</div>
            </Card.Body>
          </Card>

          <Card variant="elevated">
            <Card.Header>
              <Card.Title subtitle="Exceeded allowable threshold">Delayed Files</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="nwsdb-showcase__stat-num" style={{ color: 'var(--color-danger-solid)' }}>
                9
              </div>
              <div className="nwsdb-showcase__stat-sub">Attention required by Manager</div>
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* 2. Buttons & Badges */}
      <section>
        <h2 className="nwsdb-showcase__section-title">
          2. Action Buttons & Status Badges <span className="nwsdb-showcase__tag">&lt;Button&gt; & &lt;StatusBadge&gt;</span>
        </h2>
        <Card>
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '10px' }}>Buttons:</p>
                <div className="nwsdb-showcase__component-row">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="danger">Return File</Button>
                  <Button variant="success">Approve / Sign</Button>
                  <Button variant="primary" isLoading>Loading State</Button>
                  <Button variant="ghost">Cancel</Button>
                </div>
              </div>

              <div>
                <p style={{ fontWeight: 600, marginBottom: '10px' }}>Workflow Status Badges:</p>
                <div className="nwsdb-showcase__component-row">
                  <StatusBadge status="handed_over" />
                  <StatusBadge status="received" />
                  <StatusBadge status="pending_review" />
                  <StatusBadge status="approved" />
                  <StatusBadge status="returned" />
                  <StatusBadge status="delayed" />
                  <StatusBadge status="completed" />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </section>

      {/* 3. Form Inputs */}
      <section>
        <h2 className="nwsdb-showcase__section-title">
          3. Form Controls <span className="nwsdb-showcase__tag">&lt;Input&gt; & &lt;FormField&gt;</span>
        </h2>
        <Card>
          <Card.Body>
            <div className="nwsdb-showcase__form-grid">
              <FormField label="File Reference No." id="caseRef" required helperText="e.g. NWSDB-COL-2026-XXXX">
                <Input
                  id="caseRef"
                  placeholder="Enter file reference..."
                  value={caseFilter}
                  onChange={(e) => setCaseFilter(e.target.value)}
                />
              </FormField>

              <FormField
                label="Water Account Number"
                id="accNo"
                required
                error="Account number must be 10 digits"
              >
                <Input id="accNo" defaultValue="12345" hasError />
              </FormField>

              <FormField label="Recipient Officer" id="recipientOfficer" required>
                <Input id="recipientOfficer" placeholder="e.g. Eng. H. K. Wickramasinghe" />
              </FormField>
            </div>
          </Card.Body>
        </Card>
      </section>

      {/* 4. Movement Tracking Timeline */}
      <section>
        <h2 className="nwsdb-showcase__section-title">
          4. Movement & Audit Timeline <span className="nwsdb-showcase__tag">&lt;Timeline&gt;</span>
        </h2>
        <Card>
          <Card.Header>
            <Card.Title subtitle="Case Ref: NWSDB-COL-2026-0042 • Consumer: K. S. Perera">
              Physical File Movement History
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Timeline>
              <TimelineItem
                isCurrent={true}
                status="pending_review"
                fromPerson="P. Samarasinghe (OIC Officer)"
                fromSection="Operations / Investigation"
                toPerson="K. L. Bandara (Commercial Officer)"
                toSection="Commercial Division"
                handoverTime="2026-10-18 10:30 AM"
                receiptTime="2026-10-18 11:15 AM"
                timeInTransit="45 mins"
                timeHeld="1d 5h"
                notes="Investigation report attached with water pressure logging data."
                recordedBy="K. L. Bandara (CO)"
              />

              <TimelineItem
                status="received"
                fromPerson="CRC Desk (N. Perera)"
                fromSection="Consumer Relations"
                toPerson="P. Samarasinghe (OIC Officer)"
                toSection="Operations / Investigation"
                handoverTime="2026-10-15 02:00 PM"
                receiptTime="2026-10-16 09:10 AM"
                timeInTransit="19h 10m"
                timeHeld="2d 1h"
                delayReason="Officer engaged in emergency water main pipeline repair in Colombo North."
                notes="Physical file handed over by CRC dispatch messenger."
                recordedBy="P. Samarasinghe (OIC)"
              />

              <TimelineItem
                status="completed"
                fromPerson="Consumer Visit"
                fromSection="Public Counter"
                toPerson="CRC Desk (N. Perera)"
                toSection="Consumer Relations"
                handoverTime="2026-10-15 01:30 PM"
                receiptTime="2026-10-15 01:45 PM"
                timeInTransit="15 mins"
                timeHeld="15 mins"
                notes="Physical complaint file registered and case folder initialized."
                recordedBy="N. Perera (CRC Staff)"
              />
            </Timeline>
          </Card.Body>
        </Card>
      </section>

      {/* 5. Data Table */}
      <section>
        <h2 className="nwsdb-showcase__section-title">
          5. Data Table <span className="nwsdb-showcase__tag">&lt;Table&gt;</span>
        </h2>
        <Table hoverable striped>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Reference Number</Table.HeaderCell>
              <Table.HeaderCell>Consumer Name</Table.HeaderCell>
              <Table.HeaderCell>Error Category</Table.HeaderCell>
              <Table.HeaderCell>Current Location / Holder</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Duration</Table.HeaderCell>
              <Table.HeaderCell align="right">Action</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {sampleCases.map((c) => (
              <Table.Row key={c.id}>
                <TableCell>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{c.id}</strong>
                </TableCell>
                <TableCell>{c.consumerName}</TableCell>
                <TableCell>{c.category}</TableCell>
                <TableCell>
                  <div>
                    <strong>{c.holder}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.section}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} size="sm" />
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.timeHeld}</span>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCase(c);
                      setIsModalOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </section>

      {/* Interactive Modal Demo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCase ? `File Handover: ${selectedCase.id}` : 'Record Physical File Handover'}
        subtitle="Record physical dispatch to the next responsible officer"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Handover recorded successfully!');
                setIsModalOpen(false);
              }}
            >
              Confirm Handover
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Target Officer / Section" id="nextOfficer" required>
            <Input id="nextOfficer" placeholder="Select or enter recipient officer..." />
          </FormField>
          <FormField label="Handover Date & Time" id="handoverDate" required>
            <Input id="handoverDate" type="datetime-local" defaultValue="2026-10-19T16:50" />
          </FormField>
          <FormField label="Handover Notes" id="notes">
            <Input id="notes" placeholder="Optional notes for the recipient..." />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

export default App;
