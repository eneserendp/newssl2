import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { SSLInfo } from '../utils/sslChecker';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface UpdateDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (manualData?: { 
    validUntil: string; 
    issuer: string;
    domainExpiryDate?: string; // Add this
  }) => void;
  onAutoUpdate: () => Promise<void>;
  domain: string;
  currentSslInfo: SSLInfo;
  isUpdating: boolean;
}

export function UpdateDomainModal({
  isOpen,
  onClose,
  onConfirm,
  onAutoUpdate,
  domain,
  currentSslInfo,
  isUpdating
}: UpdateDomainModalProps) {
  const [manualValidUntil, setManualValidUntil] = useState('');
  const [manualIssuer, setManualIssuer] = useState('');
  const [manualDomainExpiry, setManualDomainExpiry] = useState(''); // Add this

  const handleAutoUpdateClick = async () => {
    try {
      await onAutoUpdate();
      window.location.reload(); // Otomatik güncelleme sonrası sayfayı yenile
    } catch (error) {
      console.error('Error during auto update:', error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-[#1E293B] p-6 shadow-xl">
                <Dialog.Title className="text-xl font-semibold text-white mb-4">
                  Update Domain Information
                </Dialog.Title>

                <div className="space-y-4">
                  {/* Domain Info */}
                  <div className="bg-[#0F172A] rounded-xl p-4">
                    <p className="text-gray-400">Domain</p>
                    <p className="text-white font-medium">{domain}</p>
                  </div>

                  {/* Current SSL Info */}
                  <div className="bg-[#0F172A] rounded-xl p-4">
                    <p className="text-gray-400 mb-2">Current Status</p>
                    <div className="space-y-2">
                      {/* SSL Status */}
                      <div>
                        <p className={`font-medium ${
                          currentSslInfo.daysRemaining > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          SSL: {currentSslInfo.daysRemaining > 0 ? 'Valid' : 'Expired'}
                        </p>
                        <p className="text-sm text-gray-400">
                          Expires in {currentSslInfo.daysRemaining} days
                          {currentSslInfo.issuer && ` (${currentSslInfo.issuer})`}
                        </p>
                      </div>

                      {/* Domain Status */}
                      {currentSslInfo.domainExpiryDate && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-gray-300 font-medium">Domain Status</p>
                          <p className="text-sm text-gray-400">
                            Expires on {new Date(currentSslInfo.domainExpiryDate).toLocaleDateString()}
                            {currentSslInfo.registrar && ` (${currentSslInfo.registrar})`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-medium text-gray-200">
                        Domain Bilgilerini Güncelleme
                      </h3>
                      
                      <button
                        onClick={handleAutoUpdateClick}
                        disabled={isUpdating}
                        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowPathIcon className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
                        {isUpdating ? 'Güncelleniyor...' : 'Bilgileri Otomatik Güncelle'}
                      </button>

                      <div className="text-center text-gray-400">veya</div>

                      {/* Manuel Güncelleme Formu */}
                      <div className="space-y-4">
                        <div className="bg-[#0F172A] rounded-xl p-4">
                          <p className="text-gray-400 mb-2">SSL Valid Until</p>
                          <input
                            type="date"
                            value={manualValidUntil}
                            onChange={(e) => setManualValidUntil(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                          />
                        </div>

                        <div className="bg-[#0F172A] rounded-xl p-4">
                          <p className="text-gray-400 mb-2">Domain Expiry Date</p>
                          <input
                            type="date"
                            value={manualDomainExpiry}
                            onChange={(e) => setManualDomainExpiry(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                          />
                        </div>

                        <div className="bg-[#0F172A] rounded-xl p-4">
                          <p className="text-gray-400 mb-2">Issuer</p>
                          <input
                            type="text"
                            value={manualIssuer}
                            onChange={(e) => setManualIssuer(e.target.value)}
                            placeholder="Enter SSL issuer..."
                            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => manualValidUntil && onConfirm({ 
                      validUntil: manualValidUntil, 
                      issuer: manualIssuer,
                      domainExpiryDate: manualDomainExpiry || undefined 
                    })}
                    disabled={!manualValidUntil}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Update Manually
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
