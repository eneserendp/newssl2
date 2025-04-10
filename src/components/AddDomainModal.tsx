import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { SSLInfo } from '../utils/sslChecker';
import { useDomains } from '../context/DomainContext';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (manualData?: { validUntil: string; issuer: string }) => Promise<boolean>;
  domain: string;
  sslInfo?: SSLInfo; // null yerine undefined kullanıyoruz
  error?: string | null;
}

export function AddDomainModal({ isOpen, onClose, onConfirm, domain, sslInfo, error }: AddDomainModalProps) {
  const { fetchDomains } = useDomains();
  
  const [isManualMode, setIsManualMode] = useState(!sslInfo || !!error);
  const [manualValidUntil, setManualValidUntil] = useState('');
  const [manualIssuer, setManualIssuer] = useState('');

  // Modal açıldığında form alanlarını sıfırla
  useEffect(() => {
    if (isOpen) {
      setManualValidUntil('');
      setManualIssuer('');
      setIsManualMode(!sslInfo || !!error);
    }
  }, [isOpen, sslInfo, error]);

  const handleConfirm = async () => {
    let success;
    if (isManualMode) {
      success = await onConfirm({
        validUntil: manualValidUntil,
        issuer: manualIssuer
      });
    } else {
      success = await onConfirm();
    }
    
    if (success) {
      await fetchDomains(); // Başarılı ekleme sonrası listeyi yenile
      onClose();
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
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

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-[#1E293B] p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold text-white mb-4">
              Add Domain to Monitoring
            </Dialog.Title>
            
            <div className="space-y-4">
              <div className="bg-[#0F172A] rounded-xl p-4">
                <p className="text-gray-400">Domain</p>
                <p className="text-white font-medium">{domain}</p>
              </div>

              {error && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-yellow-400 text-sm mb-2">
                    {error}
                  </p>
                  <p className="text-yellow-400/80 text-sm">
                    You can still add this domain manually with custom SSL information.
                  </p>
                </div>
              )}
              
              {isManualMode ? (
                <>
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
                    <p className="text-yellow-400 text-sm mb-2">
                      Domain expiry date will be fetched automatically
                    </p>
                  </div>
                </>
              ) : sslInfo ? (
                <>
                  <div className="bg-[#0F172A] rounded-xl p-4">
                    <p className="text-gray-400">SSL Status</p>
                    <p className={`font-medium ${sslInfo.daysRemaining > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {sslInfo.daysRemaining > 0 ? 'Valid' : 'Expired'}
                    </p>
                  </div>

                  <div className="bg-[#0F172A] rounded-xl p-4">
                    <p className="text-gray-400">SSL Valid Until</p>
                    <p className="text-white font-medium">
                      {new Date(sslInfo.validTo).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-blue-400 mt-1">
                      {sslInfo.daysRemaining > 0 
                        ? `${sslInfo.daysRemaining} days remaining`
                        : `Expired ${Math.abs(sslInfo.daysRemaining)} days ago`
                      }
                    </p>
                  </div>

                  {sslInfo.domainExpiryDate && (
                    <div className="bg-[#0F172A] rounded-xl p-4">
                      <p className="text-gray-400">Domain Expiry Date</p>
                      <p className="text-white font-medium">
                        {new Date(sslInfo.domainExpiryDate).toLocaleDateString()}
                      </p>
                      {sslInfo.registrar && (
                        <p className="text-sm text-blue-400 mt-1">
                          Registrar: {sslInfo.registrar}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              {!error && (
                <button
                  onClick={() => setIsManualMode(!isManualMode)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  {isManualMode ? 'Use Auto Data' : 'Enter Manually'}
                </button>
              )}
              
              <button
                onClick={handleConfirm}
                disabled={isManualMode && !manualValidUntil}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                Add to Monitoring
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}

