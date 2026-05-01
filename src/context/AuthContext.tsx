import React, { createContext, useEffect, useMemo, useState } from 'react';
import { api, DEFAULT_DEVICE_CONFIG } from '../services/api';
import { DeviceConfig } from '../types';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  config: DeviceConfig | null;
  login: (config?: Partial<DeviceConfig>) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  config: null,
  login: async () => {},
  logout: async () => {},
} as AuthContextType);

export function AuthProvider({ children }: { children: any }) {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState(null as DeviceConfig | null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await api.init();
        setConfig(stored);
        // Connectivity issues are shown inline by GateContext.error.
        setIsAuthenticated(Boolean(stored.host));
      } catch {
        setConfig(DEFAULT_DEVICE_CONFIG);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      config,
      login: async (nextConfig?: Partial<DeviceConfig>) => {
        const saved = await api.saveConfig({ ...(config ?? DEFAULT_DEVICE_CONFIG), ...nextConfig });
        const ok = await api.testConnection();
        if (!ok) {
          throw new Error('Nie udało się połączyć ze sterownikiem ChemiX Gate');
        }
        setConfig(saved);
        setIsAuthenticated(true);
      },
      logout: async () => {
        await api.clearAuth();
        setConfig(DEFAULT_DEVICE_CONFIG);
        setIsAuthenticated(false);
      },
    }),
    [config, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
