import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { webhooksApi } from '../../api/webhooks';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function WebhookForm({ webhook, availableEvents, onSuccess }) {
  const isEdit = !!webhook;
  const [url, setUrl] = useState(webhook?.url ?? '');
  const [selectedEvents, setSelectedEvents] = useState(new Set(webhook?.events ?? []));
  const [isActive, setIsActive] = useState(webhook?.isActive ?? true);
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? webhooksApi.update(webhook.id, data) : webhooksApi.create(data),
    onSuccess,
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Failed';
      setErrors({ submit: msg });
    },
  });

  const toggleEvent = (ev) => {
    setSelectedEvents((prev) => {
      const s = new Set(prev);
      if (s.has(ev)) s.delete(ev);
      else s.add(ev);
      return s;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = {};
    if (!url) e2.url = 'URL is required';
    if (selectedEvents.size === 0) e2.events = 'Select at least one event';
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }

    mutation.mutate({ url, events: [...selectedEvents], isActive });
  };

  // Group events by prefix
  const grouped = availableEvents.reduce((acc, ev) => {
    const group = ev.split('.')[0];
    if (!acc[group]) acc[group] = [];
    acc[group].push(ev);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input
        label="Webhook URL *"
        type="url"
        placeholder="https://your-server.com/webhooks"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={errors.url}
      />

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '10px' }}>
          Events * <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>({selectedEvents.size} selected)</span>
        </label>
        {errors.events && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>{errors.events}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(grouped).map(([group, events]) => (
            <div key={group}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                {group}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
                {events.map((ev) => (
                  <label
                    key={ev}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '7px',
                      border: `1px solid ${selectedEvents.has(ev) ? '#bfdbfe' : '#f1f5f9'}`,
                      background: selectedEvents.has(ev) ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(ev)}
                      onChange={() => toggleEvent(ev)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: selectedEvents.has(ev) ? '#1d4ed8' : '#64748b' }}>
                      {ev}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active (receive events)
      </label>

      {errors.submit && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', fontSize: '13px', color: '#b91c1c' }}>
          {errors.submit}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? 'Save changes' : 'Register webhook'}
        </Button>
      </div>
    </form>
  );
}
