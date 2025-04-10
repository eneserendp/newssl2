import { useState, useEffect } from 'react';
import Head from 'next/head';
import { CogIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Settings {
  cronTime: string;
  recipients: string[];
  sslWarningThreshold: number;
  domainWarningThreshold: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    cronTime: '09:00',
    recipients: [],
    sslWarningThreshold: 20,
    domainWarningThreshold: 30
  });
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi.' });
      } else {
        throw new Error('Kayıt başarısız');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ayarlar kaydedilirken bir hata oluştu.' });
    } finally {
      setIsSaving(false);
    }
  };

  const addRecipient = () => {
    if (newEmail && !settings.recipients.includes(newEmail)) {
      setSettings(prev => ({
        ...prev,
        recipients: [...prev.recipients, newEmail]
      }));
      setNewEmail('');
    }
  };

  const removeRecipient = async (email: string) => {
    try {
      // Önce state'i güncelle
      const updatedRecipients = settings.recipients.filter(e => e !== email);
      
      // State'i güncelle
      setSettings(prev => ({
        ...prev,
        recipients: updatedRecipients
      }));

      // Hemen veritabanını güncelle
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          recipients: updatedRecipients
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setMessage({ type: 'success', text: 'Alıcı başarıyla silindi.' });
    } catch (error) {
      console.error('Error removing recipient:', error);
      setMessage({ type: 'error', text: 'Alıcı silinirken bir hata oluştu.' });
      
      // Hata durumunda önceki duruma geri dön
      await fetchSettings();
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 24 saat formatına çevir
    const time = e.target.value;
    setSettings(prev => ({ 
      ...prev, 
      cronTime: time
    }));
  };

  return (
    <>
      <Head>
        <title>Ayarlar - Domain Checker</title>
      </Head>

      <main className="min-h-screen bg-[#0F172A] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="glass-effect rounded-2xl p-6 flex items-center gap-4">
            <CogIcon className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-semibold text-white">Ayarlar</h1>
          </div>

          {/* Settings Form */}
          <div className="glass-effect rounded-2xl p-6 space-y-6">
            {/* Notification Time */}
            <div>
              <label className="block text-white mb-2">Bildirim Saati (24 saat formatı)</label>
              <input
                type="time"
                value={settings.cronTime}
                onChange={(e) => setSettings(prev => ({ ...prev, cronTime: e.target.value }))}
                className="w-40 px-3 py-2 bg-[#1E293B] rounded-lg text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-sm text-gray-400 mt-1">
                24 saat formatında girin (örn: 14:30)
              </p>
            </div>

            {/* Warning Thresholds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SSL Warning Threshold */}
              <div>
                <label className="block text-white mb-2">SSL Sertifika Uyarı Süresi (Gün)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.sslWarningThreshold}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    sslWarningThreshold: Math.max(1, Math.min(365, parseInt(e.target.value) || 1))
                  }))}
                  className="w-full px-3 py-2 bg-[#1E293B] rounded-lg text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-sm text-gray-400 mt-1">
                  SSL sertifikasının bitimine kaç gün kala uyarı almak istediğinizi belirtin
                </p>
              </div>

              {/* Domain Warning Threshold */}
              <div>
                <label className="block text-white mb-2">Domain Bitiş Uyarı Süresi (Gün)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.domainWarningThreshold}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    domainWarningThreshold: Math.max(1, Math.min(365, parseInt(e.target.value) || 1))
                  }))}
                  className="w-full px-3 py-2 bg-[#1E293B] rounded-lg text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Domain süresinin bitimine kaç gün kala uyarı almak istediğinizi belirtin
                </p>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-white mb-2">Alıcılar</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="E-posta adresi ekle..."
                  className="flex-1 px-4 py-2 bg-[#1E293B] rounded-lg text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={addRecipient}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {settings.recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 bg-[#1E293B] rounded-lg"
                  >
                    <span className="text-white">{email}</span>
                    <button
                      onClick={() => removeRecipient(email)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
