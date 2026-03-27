import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  colors: {
    primary50: string;
    primary100: string;
    primary500: string;
    primary600: string;
    primary700: string;
    primary900: string;
  };
}

const defaultTenants: Record<string, TenantConfig> = {
  teogestao: {
    id: 'teogestao',
    name: 'Curso Teológico IBAD',
    shortName: 'Núcleo Cosme de Fárias',
    logoUrl: '/ibad-logo.png',
    colors: {
      primary50: '#f5f3ff',
      primary100: '#ede9fe',
      primary500: '#8b5cf6', 
      primary600: '#7c3aed', // Lilac/Violet
      primary700: '#6d28d9',
      primary900: '#4c1d95',
    }
  },

};

interface TenantContextData {
  tenant: TenantConfig;
  setTenantId: (id: string) => void;
  availableTenants: TenantConfig[];
}

export const TenantContext = createContext<TenantContextData>({
  tenant: defaultTenants.teogestao,
  setTenantId: () => {},
  availableTenants: []
});

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenantId, setTenantId] = useState<string>('teogestao');

  const tenant = defaultTenants[tenantId] || defaultTenants.teogestao;

  useEffect(() => {
    // Inject CSS variables for the current tenant colors
    const root = document.documentElement;
    root.style.setProperty('--color-primary-50', tenant.colors.primary50);
    root.style.setProperty('--color-primary-100', tenant.colors.primary100);
    root.style.setProperty('--color-primary-500', tenant.colors.primary500);
    root.style.setProperty('--color-primary-600', tenant.colors.primary600);
    root.style.setProperty('--color-primary-700', tenant.colors.primary700);
    root.style.setProperty('--color-primary-900', tenant.colors.primary900);
    
    // Update document title
    document.title = `${tenant.name} - Plataforma de Vendas e Gestão`;
  }, [tenant]);

  return (
    <TenantContext.Provider value={{
      tenant,
      setTenantId,
      availableTenants: Object.values(defaultTenants)
    }}>
      {children}
    </TenantContext.Provider>
  );
};
