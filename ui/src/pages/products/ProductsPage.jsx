import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Search, CreditCard as Edit2, Trash2, RotateCcw, Package, ListFilter as Filter, Star } from 'lucide-react';
import { productsApi } from '../../api/products';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, Thead, Tbody, Th, Tr, Td } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Input, { Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Spinner';
import ProductForm from './ProductForm';

export default function ProductsPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, showDeleted],
    queryFn: () =>
      productsApi.list({
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
    mutationFn: (id) => productsApi.delete(id, false),
    onSuccess: () => {
      toast.success('Product deleted');
      qc.invalidateQueries(['products']);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Delete failed'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => productsApi.restore(id),
    onSuccess: () => {
      toast.success('Product restored');
      qc.invalidateQueries(['products']);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Restore failed'),
  });

  const products = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Products</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            {meta?.total ?? 0} total products
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateModal(true)}>
            <Plus size={15} /> New Product
          </Button>
        )}
      </div>

      <Card>
        {/* Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            flexWrap: 'wrap',
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  outline: 'none',
                  color: '#334155',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Search</Button>
          </form>
          {isAdmin && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={showDeleted} onChange={(e) => { setShowDeleted(e.target.checked); setPage(1); }} />
              Show deleted
            </label>
          )}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={search ? `No results for "${search}"` : 'Get started by creating your first product'}
            action={isAdmin && (
              <Button onClick={() => setCreateModal(true)} size="sm">
                <Plus size={13} /> Add Product
              </Button>
            )}
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Category</Th>
                  <Th>Status</Th>
                  {isAdmin && <Th style={{ width: '100px' }}>Actions</Th>}
                </tr>
              </Thead>
              <Tbody>
                {products.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {product.imageUrls?.[0] ? (
                          <img
                            src={product.imageUrls[0]}
                            alt={product.name}
                            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, background: '#f1f5f9' }}
                          />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={14} style={{ color: '#94a3b8' }} />
                          </div>
                        )}
                        <div>
                          <p style={{ fontWeight: 500, color: '#334155', fontSize: '13px' }}>
                            {product.name}
                            {product.isFeatured && <Star size={10} style={{ color: '#f59e0b', marginLeft: '5px', verticalAlign: 'middle' }} fill="#f59e0b" />}
                          </p>
                          <p style={{ fontSize: '11px', color: '#94a3b8' }}>/{product.slug}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{product.sku || '—'}</span></Td>
                    <Td>
                      <div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>${parseFloat(product.price).toFixed(2)}</span>
                        {product.comparePrice && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>
                            ${parseFloat(product.comparePrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span style={{ color: product.stock === 0 ? '#ef4444' : product.stock < 10 ? '#f59e0b' : '#334155', fontWeight: product.stock === 0 ? 600 : 400 }}>
                        {product.stock}
                      </span>
                    </Td>
                    <Td>{product.category?.name ? <Badge variant="default">{product.category.name}</Badge> : <span style={{ color: '#94a3b8' }}>—</span>}</Td>
                    <Td>
                      {product.deletedAt ? (
                        <Badge variant="danger">Deleted</Badge>
                      ) : (
                        <Badge variant={product.isActive ? 'success' : 'default'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </Td>
                    {isAdmin && (
                      <Td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {product.deletedAt ? (
                            <button
                              onClick={() => restoreMutation.mutate(product.id)}
                              title="Restore"
                              style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#10b981' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditProduct(product)}
                                title="Edit"
                                style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${product.name}"?`)) deleteMutation.mutate(product.id);
                                }}
                                title="Delete"
                                style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Add New Product" size="lg">
        <ProductForm
          onSuccess={() => {
            setCreateModal(false);
            qc.invalidateQueries(['products']);
            toast.success('Product created');
          }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="lg">
        <ProductForm
          product={editProduct}
          onSuccess={() => {
            setEditProduct(null);
            qc.invalidateQueries(['products']);
            toast.success('Product updated');
          }}
        />
      </Modal>
    </div>
  );
}
