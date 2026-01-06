import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onOpenUrl, getCurrent } from '@tauri-apps/plugin-deep-link';
import {
  User,
  Account,
  getToken,
  getAccounts,
  getActiveAccount,
  setActiveAccountId,
  openLoginPage,
  exchangeCodeForToken,
  validateSession,
  logout as authLogout,
  logoutAll as authLogoutAll,
  getAuthState,
  clearAuthState
} from '../services/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  accounts: Account[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccounts = useCallback(async () => {
    const allAccounts = await getAccounts();
    setAccounts(allAccounts);
    return allAccounts;
  }, []);

  const refreshActiveAccount = useCallback(async () => {
    const active = await getActiveAccount();
    if (active) {
      setToken(active.token);
      setUser(active.user);
    } else {
      setToken(null);
      setUser(null);
    }
    return active;
  }, []);

  const handleAuthUrl = useCallback(async (urlString: string) => {
    const url = new URL(urlString);
    
    if (url.protocol === 'jitchat:' && url.hostname === 'auth') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const savedState = await getAuthState();
      
      if (state !== savedState) {
        console.error('Auth state mismatch');
        return;
      }
      await clearAuthState();
      
      if (code) {
        try {
          const { token: newToken, user: newUser } = await exchangeCodeForToken(code);
          setToken(newToken);
          setUser(newUser);
          await refreshAccounts();
        } catch (error) {
          console.error('Failed to exchange code:', error);
        }
      }
    }
  }, [refreshAccounts]);

  useEffect(() => {
    getCurrent().then((urls) => {
      if (urls) {
        for (const urlString of urls) {
          handleAuthUrl(urlString);
        }
      }
    }).catch(console.error);
    
    const unsubscribe = onOpenUrl(async (urls) => {
      for (const urlString of urls) {
        await handleAuthUrl(urlString);
      }
    });

    return () => {
      unsubscribe.then(fn => fn());
    };
  }, [handleAuthUrl]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        await refreshAccounts();
        const storedToken = await getToken();
        
        if (storedToken) {
          setToken(storedToken);
          const validatedUser = await validateSession();
          setUser(validatedUser);
          await refreshAccounts();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    init();
  }, [refreshAccounts]);

  const login = useCallback(async () => {
    const hasExistingAccounts = accounts.length > 0;
    await openLoginPage(hasExistingAccounts);
  }, [accounts.length]);

  const logout = useCallback(async () => {
    await authLogout();
    await refreshAccounts();
    await refreshActiveAccount();
  }, [refreshAccounts, refreshActiveAccount]);

  const logoutAll = useCallback(async () => {
    await authLogoutAll();
    setAccounts([]);
    setUser(null);
    setToken(null);
  }, []);

  const switchAccount = useCallback(async (accountId: string) => {
    await setActiveAccountId(accountId);
    await refreshActiveAccount();
  }, [refreshActiveAccount]);

  const value: AuthContextValue = {
    user,
    token,
    accounts,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    logoutAll,
    switchAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
