import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SSLInfo } from '../utils/sslChecker';
import { DomainData } from '../types/domain';

interface DomainContextType {
  domains: DomainData[];
  addDomain: (domain: string, sslInfo: SSLInfo) => Promise<boolean>;
  removeDomain: (domain: string) => Promise<void>;
  updateDomain: (domain: string, manualSslInfo?: SSLInfo) => Promise<void>;
  fetchDomains: () => Promise<void>; // Yeni eklendi
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<DomainData[]>([]);

  useEffect(() => {
    // İlk yüklemede veritabanından domainleri al
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      const data = await response.json();
      setDomains(data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const addDomain = async (domain: string, sslInfo: SSLInfo) => {
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, sslInfo }),
      });

      if (response.ok) {
        await fetchDomains(); // Listeyi yenile
        return true; // Return success status
      }
      return false;
    } catch (error) {
      console.error('Error adding domain:', error);
      return false;
    }
  };

  const removeDomain = async (domain: string) => {
    try {
      const response = await fetch(`/api/domains/${encodeURIComponent(domain)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDomains(prev => prev.filter(d => d.domain !== domain));
      }
    } catch (error) {
      console.error('Error removing domain:', error);
    }
  };

  const updateDomain = async (domain: string, manualSslInfo?: SSLInfo) => {
    try {
      const response = await fetch('/api/domains/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          domain, 
          manualSslInfo 
        }),
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const updatedDomain = await response.json();
      
      setDomains(prev => prev.map(d => 
        d.domain === domain ? updatedDomain : d
      ));

      return updatedDomain;
    } catch (error) {
      console.error('Error updating domain:', error);
      throw error;
    }
  };

  return (
    <DomainContext.Provider value={{ domains, addDomain, removeDomain, updateDomain, fetchDomains }}>
      {children}
    </DomainContext.Provider>
  );
}

export const useDomains = () => {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomains must be used within a DomainProvider');
  }
  return context;
};
