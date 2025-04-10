import { useState } from 'react';
import { useDomains } from '../context/DomainContext';
import { AddDomainModal } from './AddDomainModal';
import { SSLInfo } from '../utils/sslChecker';  // SSLInfo tipi import edildi

interface DomainFormProps {
  onDomainAdded: () => Promise<void>;
}

export function DomainForm({ onDomainAdded }: DomainFormProps) {
  const { addDomain } = useDomains();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sslInfo, setSslInfo] = useState<SSLInfo | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/check-ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        throw new Error('SSL check failed');
      }

      const data = await response.json();
      setSslInfo(data);
      setShowAddModal(true);
    } catch (error) {
      setError('Failed to fetch SSL information. Please try again.');
      setSslInfo(undefined);
      setShowAddModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (manualData?: { validUntil: string; issuer: string }) => {
    setLoading(true);
    setError(null);

    try {
      // SSL bilgilerini hazırla
      const sslInfoToAdd = manualData ? {
        valid: true,
        validFrom: new Date().toISOString(),
        validTo: new Date(manualData.validUntil).toISOString(),
        daysRemaining: Math.floor((new Date(manualData.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        issuer: manualData.issuer,
        domainExpiryDate: sslInfo?.domainExpiryDate,
        registrar: sslInfo?.registrar,
      } : sslInfo;

      if (!sslInfoToAdd) {
        setError('SSL information is missing');
        return false;
      }

      const success = await addDomain(domain, sslInfoToAdd);

      if (success) {
        setDomain('');
        setShowAddModal(false);
        await onDomainAdded(); // Liste güncelleme
        window.location.reload(); // Sayfayı yenile
        return true;
      } else {
        setError('Failed to add domain. Please try again.');
        return false;
      }
    } catch (error) {
      setError('Failed to add domain. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter domain..."
          className="flex-1 px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Add Domain'}
        </button>
      </form>

      {showAddModal && (
        <AddDomainModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onConfirm={handleConfirm}
          domain={domain}
          sslInfo={sslInfo}
          error={error}
        />
      )}
    </div>
  );
}