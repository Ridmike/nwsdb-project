import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { FileStatusBadge } from '../components/FileStatusBadge/FileStatusBadge';
import { PlusIcon, RefreshIcon, SearchIcon, TagIcon } from '../components/Icons/Icons';
import { Input } from '../components/Input/Input';
import { Select } from '../components/Input/Select';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { Table } from '../components/Table/Table';
import { CategoryModal } from '../features/reference/CategoryModal';
import { listCategories } from '../services/categoryService';
import './ReferencePages.css';

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    let active = true;

    listCategories()
      .then((rows) => {
        if (active) {
          setCategories(rows);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load categories.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function refresh(message) {
    if (message) {
      setNotice(message);
    }
    setReloadKey((value) => value + 1);
  }

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => {
      const isSub = Boolean(category.parentId);
      if (typeFilter === 'main' && isSub) {
        return false;
      }
      if (typeFilter === 'sub' && !isSub) {
        return false;
      }
      if (statusFilter === 'active' && category.active === false) {
        return false;
      }
      if (statusFilter === 'inactive' && category.active !== false) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [category.name, category.code].join(' ').toLowerCase().includes(query);
    });
  }, [categories, search, typeFilter, statusFilter]);

  function parentName(id) {
    return categories.find((category) => category.id === id)?.name || '';
  }

  return (
    <div className="reference-page">
      <PageHeader
        eyebrow="Reference data"
        title="Error categories"
        description="Classify complaints into main categories and optional subcategories. Categories appear in registration, search, and reports."
        actions={
          <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => setCreating(true)}>
            Add category
          </Button>
        }
      />

      {notice && <div className="reference-page__notice">{notice}</div>}
      {error && (
        <div className="files-alert" role="alert">
          {error}
        </div>
      )}

      <div className="reference-page__stat">
        <TagIcon size={20} />
        <div>
          <strong>{categories.filter((category) => category.active !== false).length}</strong>
          <span>active categories and subcategories</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar__field filter-bar__field--search">
          <span className="filter-bar__label">Search</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Category name or code…"
            leftIcon={<SearchIcon size={16} />}
          />
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Level</span>
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All levels</option>
            <option value="main">Main categories</option>
            <option value="sub">Subcategories</option>
          </Select>
        </div>

        <div className="filter-bar__field">
          <span className="filter-bar__label">Status</span>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </Select>
        </div>

        <div className="filter-bar__actions">
          <Button variant="outline" size="sm" icon={<RefreshIcon size={14} />} onClick={() => setReloadKey((value) => value + 1)}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="reference-table-card">
        <Card.Body noPadding>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Level</Table.HeaderCell>
                <Table.HeaderCell>Parent</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell align="right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body emptyMessage={loading ? 'Loading categories…' : 'No categories match the filters.'}>
              {visible.map((category) => (
                <Table.Row key={category.id}>
                  <Table.Cell>
                    <strong>{category.name}</strong>
                  </Table.Cell>
                  <Table.Cell>{category.code}</Table.Cell>
                  <Table.Cell>{category.parentId ? 'Subcategory' : 'Main'}</Table.Cell>
                  <Table.Cell>{parentName(category.parentId) || '—'}</Table.Cell>
                  <Table.Cell>
                    <FileStatusBadge status={category.active === false ? 'inactive' : 'active'} />
                  </Table.Cell>
                  <Table.Cell align="right">
                    <button type="button" className="reference-page__action" onClick={() => setEditing(category)}>
                      Edit
                    </button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      {creating && (
        <CategoryModal
          categories={categories}
          onClose={() => setCreating(false)}
          onSaved={(saved) => {
            setCreating(false);
            refresh(`Category ${saved.name} was added.`);
          }}
        />
      )}

      {editing && (
        <CategoryModal
          category={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            refresh(`Category ${saved.name} was updated.`);
          }}
        />
      )}
    </div>
  );
}

export default CategoriesPage;
