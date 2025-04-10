import { useDomains } from '../context/DomainContext';
import { TrashIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';
import { UpdateDomainModal } from './UpdateDomainModal';
import { DomainData } from '../types/domain'; // Yeni import

export function DomainList() {
  const { domains, removeDomain, updateDomain } = useDomains();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid'>('all');
  const [updatingDomain, setUpdatingDomain] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainData | null>(null);
  const itemsPerPage = 6;

  // Filtered domains based on search and status - Update the filtering logic
  const filteredDomains = useMemo(() => {
    return domains.filter(({ domain, sslInfo }) => {
      const matchesSearch = domain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' 
        ? true 
        : filterStatus === 'valid' 
          ? sslInfo.daysRemaining > 0
          : sslInfo.daysRemaining <= 0;
      return matchesSearch && matchesStatus;
    });
  }, [domains, searchTerm, filterStatus]);

  // Reset to first page when filters change
  const handleFilterChange = (status: 'all' | 'valid' | 'invalid') => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleUpdate = async (domain: string) => {
    setUpdatingDomain(domain);
    await updateDomain(domain);
    setUpdatingDomain(null);
  };

  const handleUpdateClick = async (domainData: DomainData) => {
    try {
      setSelectedDomain(domainData);
      setShowUpdateModal(true); // Sadece modalı aç, otomatik güncelleme yapma
    } catch (error) {
      console.error('Error preparing update:', error);
    }
  };

  const handleAutoUpdate = async (domain: string) => {
    try {
      setUpdatingDomain(domain);
      
      const response = await fetch('/api/check-ssl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain, 
          forceCheck: true // Zorla yeni kontrol yap
        })
      });

      if (!response.ok) {
        throw new Error('SSL check failed');
      }

      const newSslInfo = await response.json();
      
      // Update both SSL and domain information
      await updateDomain(domain, {
        ...newSslInfo,
        domainExpiryDate: newSslInfo.domainExpiryDate,
        registrar: newSslInfo.registrar
      });
      
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Error auto updating:', error);
    } finally {
      setUpdatingDomain(null);
    }
  };

  const handleManualUpdate = async (manualData?: { 
    validUntil: string; 
    issuer: string; 
    domainExpiryDate?: string;
  }) => {
    if (selectedDomain && manualData) {
      try {
        const manualSslInfo = {
          valid: true,
          validFrom: new Date().toISOString(),
          validTo: new Date(manualData.validUntil).toISOString(),
          daysRemaining: Math.floor((new Date(manualData.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          issuer: manualData.issuer || 'Manually Updated',
          domainExpiryDate: manualData.domainExpiryDate,
          registrar: selectedDomain.sslInfo.registrar // Keep existing registrar
        };
        
        await updateDomain(selectedDomain.domain, manualSslInfo);
        setShowUpdateModal(false);
      } catch (error) {
        console.error('Error manual updating:', error);
      }
    }
  };

  if (domains.length === 0) return null;

  // Pagination calculations
  const totalPages = Math.ceil(filteredDomains.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDomains = filteredDomains.slice(startIndex, endIndex);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Monitored Domains</h2>
        <div className="text-sm text-gray-400">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredDomains.length)} of {filteredDomains.length}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search domains..."
            className="w-full pl-10 pr-4 py-2 bg-[#1E293B] rounded-xl text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'valid', 'invalid'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-4 py-2 rounded-xl capitalize ${
                filterStatus === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#1E293B] text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Domains List */}
      <div className="space-y-4 mb-4">
        {currentDomains.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No domains match your filters
          </div>
        ) : (
          currentDomains.map((domainData) => (
            <div key={domainData.domain} className="bg-[#1E293B] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{domainData.domain}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    domainData.sslInfo.daysRemaining > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {domainData.sslInfo.daysRemaining > 0 ? 'Valid' : 'Expired'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">
                    SSL: {domainData.sslInfo.daysRemaining > 0 
                      ? `Expires in ${domainData.sslInfo.daysRemaining} days`
                      : `Expired ${Math.abs(domainData.sslInfo.daysRemaining)} days ago`
                    }
                  </p>
                  {domainData.sslInfo.domainExpiryDate && (
                    <p className="text-sm text-gray-400">
                      Domain: Expires on {new Date(domainData.sslInfo.domainExpiryDate).toLocaleDateString()}
                      {domainData.sslInfo.registrar && ` (${domainData.sslInfo.registrar})`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateClick(domainData)}
                  className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="SSL Bilgilerini Güncelle"
                >
                  <ArrowPathIcon className="w-5 h-5 text-blue-500" />
                </button>
                <button
                  onClick={() => removeDomain(domainData.domain)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Modal */}
      {selectedDomain && (
        <UpdateDomainModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onConfirm={handleManualUpdate}
          onAutoUpdate={() => handleAutoUpdate(selectedDomain.domain)}
          domain={selectedDomain.domain}
          currentSslInfo={selectedDomain.sslInfo}
          isUpdating={updatingDomain === selectedDomain.domain}
        />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              currentPage === 1 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-white hover:bg-gray-700'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg ${
                  currentPage === i + 1
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              currentPage === totalPages 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-white hover:bg-gray-700'
            }`}
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
