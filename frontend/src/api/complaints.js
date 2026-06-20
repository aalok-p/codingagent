import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fileComplaint(orderItemId, message) {
  const res = await api.post('/complaints', { order_item_id: orderItemId, message });
  return res.data;
}

export async function getSellerComplaints() {
  const res = await api.get('/complaints/seller');
  return res.data;
}

export async function resolveComplaint(complaintId) {
  const res = await api.patch(`/complaints/${complaintId}/resolve`);
  return res.data;
}
