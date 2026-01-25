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
  avatar_url: string | null;
}

export interface Account {
  id: string;
  user: User;
  token: string;
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

async function migrateFromSingleAccountFormat(): Promise<void> {
  const s = await getStore();
  const existingAccounts = await s.get<Account[]>('accounts');
  
  if (existingAccounts !== undefined) return;
  
  const oldToken = await s.get<string>('token');
  const oldUser = await s.get<User>('user');
  
  if (oldToken && oldUser) {
    const account: Account = { id: oldUser.id, user: oldUser, token: oldToken };
    await s.set('accounts', [account]);
    await s.set('activeAccountId', oldUser.id);
    await s.delete('token');
    await s.delete('user');
    await s.save();
  } else {
    await s.set('accounts', []);
    await s.save();
  }
}

export async function getAccounts(): Promise<Account[]> {
  await migrateFromSingleAccountFormat();
  const s = await getStore();
  return (await s.get<Account[]>('accounts')) ?? [];
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  const s = await getStore();
  await s.set('accounts', accounts);
  await s.save();
}

export async function getActiveAccountId(): Promise<string | null> {
  await migrateFromSingleAccountFormat();
  const s = await getStore();
  return (await s.get<string>('activeAccountId')) ?? null;
}

export async function setActiveAccountId(id: string | null): Promise<void> {
  const s = await getStore();
  if (id === null) {
    await s.delete('activeAccountId');
  } else {
    await s.set('activeAccountId', id);
  }
  await s.save();
}

export async function getActiveAccount(): Promise<Account | null> {
  const accounts = await getAccounts();
  const activeId = await getActiveAccountId();
  
  if (!activeId && accounts.length > 0) {
    await setActiveAccountId(accounts[0].id);
    return accounts[0];
  }
  
  if (!activeId) return null;
  
  return accounts.find(a => a.id === activeId) ?? null;
}

export async function addAccount(account: Account): Promise<void> {
  const accounts = await getAccounts();
  const existingIndex = accounts.findIndex(a => a.id === account.id);
  
  if (existingIndex >= 0) {
    accounts[existingIndex] = account;
  } else {
    accounts.push(account);
  }
  
  await saveAccounts(accounts);
  await setActiveAccountId(account.id);
}

export async function removeAccount(id: string): Promise<string | null> {
  const accounts = await getAccounts();
  const activeId = await getActiveAccountId();
  const filtered = accounts.filter(a => a.id !== id);
  
  await saveAccounts(filtered);
  
  if (activeId === id) {
    const newActiveId = filtered.length > 0 ? filtered[0].id : null;
    await setActiveAccountId(newActiveId);
    return newActiveId;
  }
  
  return activeId;
}

export async function clearAllAccounts(): Promise<void> {
  await saveAccounts([]);
  await setActiveAccountId(null);
}

export async function getToken(): Promise<string | null> {
  const account = await getActiveAccount();
  return account?.token ?? null;
}

export async function getStoredUser(): Promise<User | null> {
  const account = await getActiveAccount();
  return account?.user ?? null;
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

export async function openLoginPage(forceAccountPicker = false): Promise<string> {
  const state = crypto.randomUUID();
  const s = await getStore();
  await s.set('auth_state', state);
  await s.save();
  
  const params = new URLSearchParams({
    redirect_uri: REDIRECT_URI,
    state,
  });
  
  if (forceAccountPicker) {
    params.set('prompt', 'select_account');
  }
  
  const loginUrl = `${BACKEND_URL}/auth/tauri/login?${params.toString()}`;
  await openUrl(loginUrl);
  
  return state;
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
  
  await addAccount({
    id: data.user.id,
    user: data.user,
    token: data.token
  });
  
  return { token: data.token, user: data.user };
}

export async function validateSessionForAccount(account: Account): Promise<User | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${account.token}` }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const { data } = await response.json();
    return data;
  } catch {
    return null;
  }
}

export async function validateSession(): Promise<User | null> {
  const account = await getActiveAccount();
  if (!account) return null;
  
  const user = await validateSessionForAccount(account);
  
  if (!user) {
    await removeAccount(account.id);
    return null;
  }
  
  if (JSON.stringify(user) !== JSON.stringify(account.user)) {
    await addAccount({ ...account, user });
  }
  
  return user;
}

export async function logoutAccount(accountId: string): Promise<void> {
  const accounts = await getAccounts();
  const account = accounts.find(a => a.id === accountId);
  
  if (account) {
    await fetch(`${BACKEND_URL}/auth/tauri/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${account.token}` }
    }).catch(() => {});
  }
  
  await removeAccount(accountId);
}

export async function logout(): Promise<void> {
  const activeId = await getActiveAccountId();
  if (activeId) {
    await logoutAccount(activeId);
  }
}

export async function logoutAll(): Promise<void> {
  const accounts = await getAccounts();
  
  await Promise.all(
    accounts.map(account =>
      fetch(`${BACKEND_URL}/auth/tauri/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${account.token}` }
      }).catch(() => {})
    )
  );
  
  await clearAllAccounts();
}

export function getBackendUrl(): string {
  return BACKEND_URL;
}
