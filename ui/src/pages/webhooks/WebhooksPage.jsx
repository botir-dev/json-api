import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Webhook, CreditCard as Edit2, Trash2, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle } from 'lucide-react';
import { webhooksApi } from '../../api/webhooks';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, Thead, Tbody, Th, Tr, Td } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Spinner';
import { format } from 'date-fns';
import WebhookForm from './WebhookForm';

export default function WebhooksPage() {
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editWebhook, setEditWebhook] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhooksApi.list(),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: () => webhooksApi.events(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => webhooksApi.delete(id),
    onSuccess: () => { toast.success('Webhook deleted'); qc.invalidateQueries(['webhooks']); },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Delete failed'),
  });

  const webhooks = data?.data?.data ?? [];
  const availableEvents = eventsData?.data?.data ?? [];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Webhooks</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Receive real-time event notifications
          </p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus size={15} /> New Webhook
        </Button>
      </div>

      {/* Events reference */}
      {availableEvents.length > 0 && (
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Available Events</p>
          </div>
          <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableEvents.map((ev) => (
              <span
                key={ev}
                style={{ padding: '3px 8px', background: '#f1f5f9', borderRadius: '5px', fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}
              >
                {ev}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <PageLoader />
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="No webhooks registered"
            description="Add a webhook to receive real-time event notifications"
            action={
              <Button onClick={() => setCreateModal(true)} size="sm">
                <Plus size={13} /> Add Webhook
              </Button>
            }
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>URL</Th>
                <Th>Events</Th>
                <Th>Status</Th>
                <Th>Failures</Th>
                <Th>Last called</Th>
                <Th style={{ width: '80px' }}>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {webhooks.map((wh) => (
                <Tr key={wh.id}>
                  <Td>
                    <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#334155', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {wh.url}
                    </p>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                      {wh.events?.slice(0, 3).map((ev) => (
                        <span key={ev} style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', color: '#475569' }}>
                          {ev}
                        </span>
                      ))}
                      {wh.events?.length > 3 && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>+{wh.events.length - 3} more</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {wh.isActive ? (
                        <CheckCircle size={14} style={{ color: '#10b981' }} />
                      ) : (
                        <XCircle size={14} style={{ color: '#ef4444' }} />
                      )}
                      <Badge variant={wh.isActive ? 'success' : 'danger'}>
                        {wh.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {wh.failCount >= 3 && <AlertTriangle size={13} style={{ color: '#f59e0b' }} />}
                      <span style={{ fontSize: '13px', color: wh.failCount >= 5 ? '#ef4444' : wh.failCount >= 3 ? '#f59e0b' : '#334155', fontWeight: wh.failCount > 0 ? 600 : 400 }}>
                        {wh.failCount}
                      </span>
                      {wh.failCount >= 5 && <span style={{ fontSize: '11px', color: '#ef4444' }}>(disabled)</span>}
                    </div>
                  </Td>
                  <Td>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {wh.lastCalledAt ? format(new Date(wh.lastCalledAt), 'MMM d, HH:mm') : '—'}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => setEditWebhook(wh)}
                        title="Edit"
                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this webhook?')) deleteMutation.mutate(wh.id); }}
                        title="Delete"
                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Register Webhook" size="md">
        <WebhookForm
          availableEvents={availableEvents}
          onSuccess={() => {
            setCreateModal(false);
            qc.invalidateQueries(['webhooks']);
            toast.success('Webhook registered');
          }}
        />
      </Modal>

      <Modal open={!!editWebhook} onClose={() => setEditWebhook(null)} title="Edit Webhook" size="md">
        <WebhookForm
          webhook={editWebhook}
          availableEvents={availableEvents}
          onSuccess={() => {
            setEditWebhook(null);
            qc.invalidateQueries(['webhooks']);
            toast.success('Webhook updated');
          }}
        />
      </Modal>
    </div>
  );
}
