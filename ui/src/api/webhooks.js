import client from './client';

export const webhooksApi = {
  list: () => client.get('/webhooks'),
  create: (data) => client.post('/webhooks', data),
  update: (id, data) => client.patch(`/webhooks/${id}`, data),
  delete: (id) => client.delete(`/webhooks/${id}`),
  events: () => client.get('/webhooks/events'),
};
