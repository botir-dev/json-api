import { useState } from 'react';
import Badge, { statusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { format } from 'date-fns';

const VALID_TRANSITIONS = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export default function OrderDetail({ order, isAdmin, onStatusChange, statusLoading }) {
  const [newStatus, setNewStatus] = useState('');
  const transitions = VALID_TRANSITIONS[order.status] || [];

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>{title}</p>
      {children}
    </div>
  );

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 500, color: '#334155' }}>{value}</span>
    </div>
  );

  return (
    <div>
      {/* Status + timeline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Badge variant={statusBadge(order.status)} style={{ fontSize: '12px', padding: '4px 10px' }}>
          {order.status}
        </Badge>
        {order.paidAt && <Badge variant="success">Paid</Badge>}
        {isAdmin && transitions.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', color: '#334155' }}
            >
              <option value="">Change status...</option>
              {transitions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button
              size="sm"
              disabled={!newStatus}
              loading={statusLoading}
              onClick={() => { if (newStatus) { onStatusChange(newStatus); setNewStatus(''); } }}
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* Items */}
      <Section title="Order Items">
        <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
          {order.items?.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: i < order.items.length - 1 ? '1px solid #f8fafc' : 'none',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                  {item.product?.name || item.productId}
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                  ${parseFloat(item.unitPrice).toFixed(2)} each &times; {item.quantity}
                </p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                ${parseFloat(item.totalPrice).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Totals */}
      <Section title="Summary">
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 16px' }}>
          <Row label="Subtotal" value={`$${parseFloat(order.subtotal).toFixed(2)}`} />
          <Row label="Tax (10%)" value={`$${parseFloat(order.tax).toFixed(2)}`} />
          <Row label="Shipping" value={parseFloat(order.shippingCost) === 0 ? 'Free' : `$${parseFloat(order.shippingCost).toFixed(2)}`} />
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            <span>Total</span>
            <span>${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>
      </Section>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <Section title="Shipping Address">
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#475569', lineHeight: '1.7' }}>
            <strong style={{ color: '#334155' }}>{order.shippingAddress.fullName}</strong><br />
            {order.shippingAddress.address1}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
            {order.shippingAddress.country}
          </div>
        </Section>
      )}

      {/* Timestamps */}
      <Section title="Timeline">
        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {order.createdAt && <span>Created: {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}</span>}
          {order.paidAt && <span>Paid: {format(new Date(order.paidAt), 'MMM d, yyyy HH:mm')}</span>}
          {order.shippedAt && <span>Shipped: {format(new Date(order.shippedAt), 'MMM d, yyyy HH:mm')}</span>}
          {order.deliveredAt && <span>Delivered: {format(new Date(order.deliveredAt), 'MMM d, yyyy HH:mm')}</span>}
          {order.cancelledAt && <span>Cancelled: {format(new Date(order.cancelledAt), 'MMM d, yyyy HH:mm')}</span>}
        </div>
      </Section>
    </div>
  );
}
