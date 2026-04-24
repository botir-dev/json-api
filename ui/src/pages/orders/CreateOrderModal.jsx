import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, Search } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { productsApi } from '../../api/products';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function CreateOrderModal({ onSuccess }) {
  const [step, setStep] = useState(1); // 1=items, 2=address
  const [items, setItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [address, setAddress] = useState({ fullName: '', address1: '', city: '', state: '', zip: '', country: 'US' });
  const [errors, setErrors] = useState({});

  const { data: productsData } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: () => productsApi.list({ search: productSearch, limit: 10, page: 1 }),
    enabled: productSearch.length > 1,
  });

  const mutation = useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess,
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Order creation failed';
      setErrors({ submit: msg });
    },
  });

  const products = productsData?.data?.data ?? [];

  const addItem = (product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    setProductSearch('');
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
    }
  };

  const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

  const handleSubmit = () => {
    const e = {};
    if (!address.fullName) e.fullName = 'Required';
    if (!address.address1) e.address1 = 'Required';
    if (!address.city) e.city = 'Required';
    if (!address.state) e.state = 'Required';
    if (!address.zip) e.zip = 'Required';
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    mutation.mutate({ items: items.map(({ productId, quantity }) => ({ productId, quantity })), shippingAddress: address });
  };

  const addrField = (name) => ({
    value: address[name],
    onChange: (e) => setAddress((a) => ({ ...a, [name]: e.target.value })),
    error: errors[name],
  });

  return (
    <div>
      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ n: 1, label: 'Select Items' }, { n: 2, label: 'Shipping Info' }].map(({ n, label }) => (
          <button
            key={n}
            onClick={() => n < step || items.length > 0 ? setStep(n) : null}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              background: step === n ? '#dbeafe' : '#f1f5f9',
              color: step === n ? '#1d4ed8' : '#64748b',
              cursor: 'pointer',
            }}
          >
            <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: step === n ? '#3b82f6' : '#cbd5e1', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{n}</span>
            {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Product search */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>Add products</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name..."
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', color: '#334155' }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            {products.length > 0 && productSearch.length > 1 && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f8fafc', textAlign: 'left', fontFamily: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{p.name}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>Stock: {p.stock}</p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>${parseFloat(p.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart items */}
          {items.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Cart</p>
              <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                {items.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f8fafc', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{item.name}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8' }}>${parseFloat(item.price).toFixed(2)} each</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => updateQty(item.productId, item.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>-</button>
                      <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>+</button>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', minWidth: '60px', textAlign: 'right' }}>
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                    <button onClick={() => updateQty(item.productId, 0)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#0f172a', background: '#f8fafc' }}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button disabled={items.length === 0} onClick={() => setStep(2)}>
              Continue to Shipping
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Full name *" {...addrField('fullName')} />
          <Input label="Address *" {...addrField('address1')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="City *" {...addrField('city')} />
            <Input label="State *" placeholder="NY" {...addrField('state')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="ZIP *" {...addrField('zip')} />
            <Input label="Country" {...addrField('country')} />
          </div>

          {errors.submit && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', fontSize: '13px', color: '#b91c1c' }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button loading={mutation.isPending} onClick={handleSubmit}>
              Place Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
