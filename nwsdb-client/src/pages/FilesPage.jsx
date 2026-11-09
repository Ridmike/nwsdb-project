import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { FileStatusBadge } from '../components/FileStatusBadge/FileStatusBadge';
import { PlusIcon, SearchIcon } from '../components/Icons/Icons';
import { Input } from '../components/Input/Input';
import { Select } from '../components/Input/Select';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { Table } from '../components/Table/Table';
import { CreateFileModal } from '../features/files/CreateFileModal';
import { useAuth } from '../hooks/useAuth';
import { listCategories } from '../services/categoryService';
import { listFiles } from '../services/fileService';
import { formatDate } from '../utils/format';
import { canCreateFiles } from '../utils/roles';
import './FilesPage.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'pending_receipt', label: 'Awaiting receipt' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export function FilesPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || '';

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(statusParam);
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [overdue, setOverdue] = useState(searchParams.get('overdue') === '1');
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(searchParams.get('new') === '1');

  useEffect(() => {
    let active = true;

    listCategories()
      .then((rows) => {
        if (active) {
          setCategories(rows);
        }
      })
      .catch(() => {
        if (active) {
          setCategories([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      listFiles({ search, status, categoryId, overdue: overdue ? '1' : '' })
        .then((rows) => {
          if (active) {
            setFiles(rows);
            setError('');
          }
        })
        .catch((err) => {
          if (active) {
            setError(err.message || 'Could not load files.');
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, status, categoryId, overdue, reloadKey]);

  function handleCreateClose() {
    setCreateOpen(false);
    if (searchParams.get('new')) {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }

  function handleCreated(file) {
    handleCreateClose();
    navigate(`/files/${file.id}`);
  }

  function resetFilters() {
    setSearch('');
    setStatus('');
    setCategoryId('');
    setOverdue(false);
  }

  const mainCategories = categories.filter((category) => !category.parentId);
  const filtersActive = Boolean(search || status || categoryId || overdue);

  return (
    <div className="files-page">
      <PageHeader
        eyebrow="Case files"
        title="Water bill adjustment files"
        description="Register complaints, search the physical file register, and open a file to record handovers, receipts, and approvals."
        actions={
          canCreateFiles(role) ? (
            <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => setCreateOpen(true)}>
              Register file
            </Button>
          ) : null
        }
      />

      <div className="filter-bar">
        <div className="filter-bar__field filter-bar__field--search">
          <span className="filter-bar__label">Search</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Reference, complaint number, consumer, phone…"
            leftIcon={<SearchIcon size={16} />}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Status</span>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Category</span>
          <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">All categories</option>
            {mainCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <label className="nwsdb-checkbox">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(event) => setOverdue(event.target.checked)}
          />
          Overdue only
        </label>

        <div className="filter-bar__actions">
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="files-alert" role="alert">
          {error}
        </div>
      )}

      <Card className="files-table-card">
        <Card.Header
          action={
            <span className="files-count">
              {loading ? 'Loading…' : `${files.length} file${files.length === 1 ? '' : 's'}`}
            </span>
          }
        >
          <Card.Title subtitle="Latest registrations are shown first">File register</Card.Title>
        </Card.Header>
        <Card.Body noPadding>
          <Table hoverable>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Reference</Table.HeaderCell>
                <Table.HeaderCell>Consumer</Table.HeaderCell>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Current holder</Table.HeaderCell>
                <Table.HeaderCell>Registered</Table.HeaderCell>
                <Table.HeaderCell>Due</Table.HeaderCell>
                <Table.HeaderCell align="right"> </Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body emptyMessage={loading ? 'Loading files…' : 'No files match the selected filters.'}>
              {files.map((file) => (
                <Table.Row key={file.id}>
                  <Table.Cell>
                    <Link to={`/files/${file.id}`} className="files-reference">
                      {file.reference}
                    </Link>
                    {file.priority === 'urgent' && <span className="files-urgent">Urgent</span>}
                  </Table.Cell>
                  <Table.Cell>
                    <span className="files-consumer">{file.consumerName}</span>
                    <small className="files-muted">{file.complaintNo || 'No complaint number'}</small>
                  </Table.Cell>
                  <Table.Cell>
                    <span>{file.categoryName}</span>
                    {file.subCategoryName && <small className="files-muted">{file.subCategoryName}</small>}
                  </Table.Cell>
                  <Table.Cell>
                    <FileStatusBadge status={file.status} overdue={file.overdue} />
                  </Table.Cell>
                  <Table.Cell>
                    <span>{file.currentHolderName || 'Unassigned'}</span>
                    <small className="files-muted">{file.currentDepartmentName || '—'}</small>
                  </Table.Cell>
                  <Table.Cell>{formatDate(file.registeredAt)}</Table.Cell>
                  <Table.Cell>
                    <span className={file.overdue ? 'files-overdue' : ''}>{formatDate(file.dueDate)}</span>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Link to={`/files/${file.id}`} className="files-open">
                      Open
                    </Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      {createOpen && (
        <CreateFileModal
          categories={categories}
          onClose={handleCreateClose}
          onSaved={handleCreated}
        />
      )}
    </div>
  );
}

export default FilesPage;
