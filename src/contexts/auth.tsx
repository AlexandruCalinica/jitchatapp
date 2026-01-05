import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onOpenUrl, getCurrent } from '@tauri-apps/plugin-deep-link';
import {
  User,
  getToken,
  openLoginPage,
  exchangeCodeForToken,
  validateSession,
  logout as authLogout,
  getAuthState,
  clearAuthState
} from '../services/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        } catch (error) {
          console.error('Failed to exchange code:', error);
        }
      }
    }
  }, []);

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
        const storedToken = await getToken();
        
        if (storedToken) {
          setToken(storedToken);
          const validatedUser = await validateSession();
          setUser(validatedUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    init();
  }, []);

  const login = useCallback(async () => {
    await openLoginPage();
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setToken(null);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout
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
