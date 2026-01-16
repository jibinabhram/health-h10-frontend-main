import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { STORAGE_KEYS } from '../../utils/constants';
import { hydrateSQLiteFromBackend } from '../../services/hydrateMetrics.service';
import { syncPendingMetrics } from '../../services/syncMetrics.service';

interface AuthContextType {
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (payload: { role: string; token: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  isAuthenticated: false,
  setAuth: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [authRestored, setAuthRestored] = useState(false);

  /* ---------------------------------
     1️⃣ Restore session ONCE
  ----------------------------------*/
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedRole = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);

      if (token && storedRole) {
        setRole(storedRole);
        setIsAuthenticated(true);
      }

      setAuthRestored(true); // 🔑 CRITICAL
    })();
  }, []);

  /* ---------------------------------
     2️⃣ Hydrate SQLite ONCE after auth
  ----------------------------------*/
  useEffect(() => {
    if (!authRestored) return;
    if (!isAuthenticated) return;
    if (hydrated) return;

    hydrateSQLiteFromBackend()
      .then(() => setHydrated(true))
      .catch(err => console.log('❌ Hydration error', err));
  }, [authRestored, isAuthenticated, hydrated]);

  /* ---------------------------------
     3️⃣ Auto-sync when online
  ----------------------------------*/
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('🌐 Internet detected → syncing data...');
        syncPendingMetrics();
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  /* ---------------------------------
     4️⃣ Login handler
  ----------------------------------*/
  const setAuth = async ({ role, token }: { role: string; token: string }) => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, token],
      [STORAGE_KEYS.ROLE, role],
    ]);

    setRole(role);
    setIsAuthenticated(true);
  };

  /* ---------------------------------
     5️⃣ Logout
  ----------------------------------*/
  const logout = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.ROLE,
      STORAGE_KEYS.USER_NAME,
    ]);

    setRole(null);
    setIsAuthenticated(false);
    setHydrated(false);
  };

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);