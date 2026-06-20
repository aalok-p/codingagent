import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export async function signup(fullName, email, phone, password, role) {
  const res = await api.post('/auth/signup', {
    full_name: fullName,
    email,
    phone,
    password,
    role,
  });
  return res.data;
}

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function googleLogin(idToken) {
  const res = await api.post('/auth/google', { id_token: idToken });
  return res.data;
}

export async function updateRole(role) {
  const res = await api.patch('/auth/role', { role });
  return res.data;
}
