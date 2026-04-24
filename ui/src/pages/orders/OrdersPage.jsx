import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ShoppingCart, Search, Eye, DollarSign, ChevronDown } from 'lucide-react';
import { ordersApi } from '../../api/orders';
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
import OrderDetail from './OrderDetail';
import CreateOrderModal from './CreateOrderModal';

const STATUS_OPTIONS = ['', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [createModal, setCreateModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search],
    queryFn: () =>
      ordersApi.list({
        page,
        limit: 20,
        search: search || undefined,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries(['orders']);
      if (viewOrder) {
        ordersApi.getById(viewOrder.id).then((r) => setViewOrder(r.data.data));
      }
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Update failed'),
  });

  const payMutation = useMutation({
    mutationFn: (id) => ordersApi.markAsPaid(id),
    onSuccess: () => {
      toast.success('Order marked as paid');
      qc.invalidateQueries(['orders']);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const orders = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openOrder = async (id) => {
    try {
      const res = await ordersApi.getById(id);
      setViewOrder(res.data.data);
    } catch (err) {
      toast.error('Could not load order details');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Orders</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            {meta?.total ?? 0} total orders
          </p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <ShoppingCart size={15} /> New Order
        </Button>
      </div>

      <Card>
        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search order number or status..."
                style={{ width: '100%', padding: '7px 12px 7px 32px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', color: '#334155' }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Search</Button>
          </form>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="Orders will appear here once placed"
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Order</Th>
                  {isAdmin && <Th>Customer</Th>}
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th style={{ width: '80px' }}>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <Tr key={order.id} onClick={() => openOrder(order.id)}>
                    <Td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        {order.orderNumber}
                      </span>
                    </Td>
                    {isAdmin && (
                      <Td>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {order.user?.username || order.user?.email || '—'}
                        </span>
                      </Td>
                    )}
                    <Td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        ${parseFloat(order.total).toFixed(2)}
                      </span>
                    </Td>
                    <Td><Badge variant={statusBadge(order.status)}>{order.status}</Badge></Td>
                    <Td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </span>
                    </Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => openOrder(order.id)}
                          title="View details"
                          style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Eye size={14} />
                        </button>
                        {isAdmin && !order.paidAt && order.status === 'PENDING' && (
                          <button
                            onClick={() => payMutation.mutate(order.id)}
                            title="Mark as paid"
                            style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#10b981' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <DollarSign size={14} />
                          </button>
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

      {/* Order Detail Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order ${viewOrder?.orderNumber || ''}`} size="lg">
        {viewOrder && (
          <OrderDetail
            order={viewOrder}
            isAdmin={isAdmin}
            onStatusChange={(status) => statusMutation.mutate({ id: viewOrder.id, status })}
            statusLoading={statusMutation.isPending}
          />
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create New Order" size="lg">
        <CreateOrderModal
          onSuccess={() => {
            setCreateModal(false);
            qc.invalidateQueries(['orders']);
            toast.success('Order created');
          }}
        />
      </Modal>
    </div>
  );
}
