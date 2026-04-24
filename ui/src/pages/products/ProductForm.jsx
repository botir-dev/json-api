import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { productsApi } from '../../api/products';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';

export default function ProductForm({ product, onSuccess }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? '',
    comparePrice: product?.comparePrice ?? '',
    stock: product?.stock ?? 0,
    sku: product?.sku ?? '',
    imageUrls: product?.imageUrls?.join(', ') ?? '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? productsApi.update(product.id, data) : productsApi.create(data),
    onSuccess,
    onError: (err) => {
      const details = err.response?.data?.error?.details;
      if (details) {
        const e = {};
        details.forEach(({ field, message }) => { e[field] = message; });
        setErrors(e);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
      stock: parseInt(form.stock),
      imageUrls: form.imageUrls
        ? form.imageUrls.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };
    mutation.mutate(payload);
  };

  const f = (name) => ({
    value: form[name],
    onChange: (e) => setForm((p) => ({ ...p, [name]: e.target.value })),
    error: errors[name],
  });

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Input label="Product name *" placeholder="e.g. Premium Laptop 15" {...f('name')} />

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '6px' }}>
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Product description..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none',
            color: '#1e293b',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <Input label="Price *" type="number" step="0.01" placeholder="99.99" {...f('price')} />
        <Input label="Compare price" type="number" step="0.01" placeholder="129.99" {...f('comparePrice')} />
        <Input label="Stock" type="number" min="0" {...f('stock')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input label="SKU" placeholder="SKU-ABC123" {...f('sku')} />
        <Input label="Image URLs (comma separated)" placeholder="https://..." {...f('imageUrls')} />
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
          />
          Active
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
          />
          Featured
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
