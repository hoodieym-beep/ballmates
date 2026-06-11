import { API_URL } from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ballmates_token';

export async function getStoredToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token) {
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (_) {}
}

export async function api(endpoint, options = {}) {
  const token = await getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data;
}

export function apiUpload(endpoint, formData, method = 'POST') {
  return getStoredToken().then((token) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_URL}${endpoint}`, { method, headers, body: formData }).then((res) => res.json().then((data) => {
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    }));
  });
}
