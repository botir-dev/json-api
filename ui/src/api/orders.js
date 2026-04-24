import client from './client';

export const ordersApi = {
  list: (params) => client.get('/orders', { params }),
  getById: (id) => client.get(`/orders/${id}`),
  create: (data) => client.post('/orders', data),
  updateStatus: (id, status) => client.patch(`/orders/${id}/status`, { status }),
  markAsPaid: (id) => client.post(`/orders/${id}/pay`),
  delete: (id) => client.delete(`/orders/${id}`),
};
