import { load, Store } from '@tauri-apps/plugin-store';
import { openUrl } from '@tauri-apps/plugin-opener';

const BACKEND_URL = 'http://localhost:4000';
const REDIRECT_URI = 'jitchat://auth';
const STORE_PATH = 'auth.json';

export interface User {
  id: string;
  email: string;
  username: string;
  color: string;
}

interface AuthResponse {
  data: {
    token: string;
    user: User;
    expires_at: string | null;
  };
}

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await load(STORE_PATH);
  }
  return store;
}

export async function getToken(): Promise<string | null> {
  const s = await getStore();
  return (await s.get<string>('token')) ?? null;
}

export async function saveToken(token: string): Promise<void> {
  const s = await getStore();
  await s.set('token', token);
  await s.save();
}

export async function clearToken(): Promise<void> {
  const s = await getStore();
  await s.delete('token');
  await s.save();
}

export async function getStoredUser(): Promise<User | null> {
  const s = await getStore();
  return (await s.get<User>('user')) ?? null;
}

export async function saveUser(user: User): Promise<void> {
  const s = await getStore();
  await s.set('user', user);
  await s.save();
}

export async function clearUser(): Promise<void> {
  const s = await getStore();
  await s.delete('user');
  await s.save();
}

export async function openLoginPage(): Promise<string> {
  const state = crypto.randomUUID();
  const s = await getStore();
  await s.set('auth_state', state);
  await s.save();
  
  const loginUrl = `${BACKEND_URL}/auth/tauri/login?redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
  await openUrl(loginUrl);
  
  return state;
}

export async function getAuthState(): Promise<string | null> {
  const s = await getStore();
  return (await s.get<string>('auth_state')) ?? null;
}

export async function clearAuthState(): Promise<void> {
  const s = await getStore();
  await s.delete('auth_state');
  await s.save();
}

export async function exchangeCodeForToken(code: string): Promise<{ token: string; user: User }> {
  const response = await fetch(`${BACKEND_URL}/auth/tauri/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      redirect_uri: REDIRECT_URI
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Token exchange failed');
  }
  
  const { data } = await response.json() as AuthResponse;
  
  await saveToken(data.token);
  await saveUser(data.user);
  
  return { token: data.token, user: data.user };
}

export async function validateSession(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;
  
  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      await clearToken();
      await clearUser();
      return null;
    }
    
    const { data } = await response.json();
    await saveUser(data);
    return data;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const token = await getToken();
  
  if (token) {
    await fetch(`${BACKEND_URL}/auth/tauri/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
  }
  
  await clearToken();
  await clearUser();
}

export function getBackendUrl(): string {
  return BACKEND_URL;
}
