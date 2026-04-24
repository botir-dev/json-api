import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Search, Users, Shield, Trash2, RotateCcw, ChevronDown } from 'lucide-react';
import { usersApi } from '../../api/users';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { statusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Th, Tr, Td } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Spinner';
import { format } from 'date-fns';

const ROLES = ['USER', 'MODERATOR', 'ADMIN'];

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [roleModal, setRoleModal] = useState(null); // { user, newRole }

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, showDeleted],
    queryFn: () =>
      usersApi.list({
        page,
        limit: 20,
        search: search || undefined,
        deleted: showDeleted || undefined,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries(['users']); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Delete failed'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => usersApi.restore(id),
    onSuccess: () => { toast.success('User restored'); qc.invalidateQueries(['users']); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Restore failed'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries(['users']);
      setRoleModal(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const users = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Users</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            {meta?.total ?? 0} total users
          </p>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, or username..."
                style={{ width: '100%', padding: '7px 12px 7px 32px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', color: '#334155' }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Search</Button>
          </form>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={showDeleted} onChange={(e) => { setShowDeleted(e.target.checked); setPage(1); }} />
            Show deleted
          </label>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description={search ? `No results for "${search}"` : 'No users yet'} />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>User</Th>
                  <Th>Username</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th>Last login</Th>
                  <Th style={{ width: '100px' }}>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#fff',
                            flexShrink: 0,
                          }}
                        >
                          {user.firstName?.[0] || user.username?.[0] || '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, color: '#334155', fontSize: '13px' }}>
                            {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '—'}
                          </p>
                          <p style={{ fontSize: '11px', color: '#94a3b8' }}>{user.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>@{user.username}</span></Td>
                    <Td><Badge variant={statusBadge(user.role)}>{user.role}</Badge></Td>
                    <Td>
                      {user.deletedAt ? (
                        <Badge variant="danger">Deleted</Badge>
                      ) : (
                        <Badge variant={user.isActive ? 'success' : 'default'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </Td>
                    <Td><span style={{ fontSize: '12px', color: '#64748b' }}>{format(new Date(user.createdAt), 'MMM d, yyyy')}</span></Td>
                    <Td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, yyyy') : '—'}
                      </span>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {user.deletedAt ? (
                          <button
                            onClick={() => restoreMutation.mutate(user.id)}
                            title="Restore"
                            style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#10b981' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <RotateCcw size={14} />
                          </button>
                        ) : (
                          <>
                            {user.id !== currentUser?.id && (
                              <>
                                <button
                                  onClick={() => setRoleModal({ user, newRole: user.role })}
                                  title="Change role"
                                  style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Shield size={14} />
                                </button>
                                <button
                                  onClick={() => { if (confirm(`Delete user "${user.username}"?`)) deleteMutation.mutate(user.id); }}
                                  title="Delete"
                                  style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Role change modal */}
      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} title="Change User Role" size="sm">
        {roleModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Changing role for <strong style={{ color: '#334155' }}>@{roleModal.user.username}</strong>
            </p>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>New role</label>
              <select
                value={roleModal.newRole}
                onChange={(e) => setRoleModal((r) => ({ ...r, newRole: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', color: '#334155' }}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setRoleModal(null)}>Cancel</Button>
              <Button
                loading={roleMutation.isPending}
                onClick={() => roleMutation.mutate({ id: roleModal.user.id, role: roleModal.newRole })}
              >
                Update Role
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
