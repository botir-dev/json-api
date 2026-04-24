import client from './client';

export const productsApi = {
  list: (params) => client.get('/products', { params }),
  getById: (id) => client.get(`/products/${id}`),
  getBySlug: (slug) => client.get(`/products/slug/${slug}`),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.patch(`/products/${id}`, data),
  delete: (id, hard = false) => client.delete(`/products/${id}`, { params: { hard } }),
  restore: (id) => client.post(`/products/${id}/restore`),
};
