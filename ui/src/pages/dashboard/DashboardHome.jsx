import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart, Users, TrendingUp, CircleAlert as AlertCircle, Clock, CircleCheck as CheckCircle, DollarSign } from 'lucide-react';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { usersApi } from '../../api/users';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Badge, { statusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color = '#3b82f6', loading }) {
  return (
    <Card>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            {label}
          </p>
          {loading ? (
            <div className="animate-pulse" style={{ height: '28px', width: '80px', background: '#f1f5f9', borderRadius: '6px' }} />
          ) : (
            <p style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</p>
          )}
          {sub && <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{sub}</p>}
        </div>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `${color}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const { data: productsData, isLoading: pLoading } = useQuery({
    queryKey: ['products', 'stats'],
    queryFn: () => productsApi.list({ limit: 1 }),
  });

  const { data: ordersData, isLoading: oLoading } = useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => ordersApi.list({ limit: 5, sortBy: 'createdAt', sortDir: 'desc' }),
  });

  const { data: usersData, isLoading: uLoading } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => usersApi.list({ limit: 1 }),
    enabled: isAdmin,
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['orders', 'pending'],
    queryFn: () => ordersApi.list({ limit: 1, search: 'PENDING' }),
  });

  const totalProducts = productsData?.data?.meta?.total ?? 0;
  const totalOrders = ordersData?.data?.meta?.total ?? 0;
  const totalUsers = usersData?.data?.meta?.total ?? 0;
  const recentOrders = ordersData?.data?.data ?? [];

  const totalRevenue = recentOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
          Good day, {user?.firstName || user?.username}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <StatCard
          icon={Package}
          label="Total Products"
          value={totalProducts}
          color="#3b82f6"
          loading={pLoading}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={totalOrders}
          color="#10b981"
          loading={oLoading}
        />
        {isAdmin && (
          <StatCard
            icon={Users}
            label="Total Users"
            value={totalUsers}
            color="#f59e0b"
            loading={uLoading}
          />
        )}
        <StatCard
          icon={DollarSign}
          label="Recent Revenue"
          value={`$${totalRevenue.toFixed(0)}`}
          sub="Last 5 orders"
          color="#8b5cf6"
          loading={oLoading}
        />
      </div>

      {/* Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <Card style={{ gridColumn: 'span 2' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Recent Orders</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Last 5 orders</span>
          </div>
          {oLoading ? (
            <PageLoader />
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No orders yet
            </div>
          ) : (
            <div>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 24px',
                    borderBottom: '1px solid #f8fafc',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      {order.orderNumber}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant={statusBadge(order.status)}>{order.status}</Badge>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    ${parseFloat(order.total).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick status overview */}
        <Card>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>Order Status</h2>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Pending', icon: Clock, color: '#f59e0b', bg: '#fef9c3' },
              { label: 'Processing', icon: TrendingUp, color: '#3b82f6', bg: '#dbeafe' },
              { label: 'Delivered', icon: CheckCircle, color: '#10b981', bg: '#dcfce7' },
              { label: 'Cancelled', icon: AlertCircle, color: '#ef4444', bg: '#fee2e2' },
            ].map(({ label, icon: Icon, color, bg }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <span style={{ fontSize: '13px', color: '#475569', flex: 1 }}>{label} Orders</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  {recentOrders.filter((o) => o.status === label.toUpperCase()).length}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
