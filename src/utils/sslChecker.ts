import * as https from 'https';
import * as tls from 'tls';

// Ana SSLInfo interface tanımı burada olacak
export interface SSLInfo {
  valid: boolean;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  issuer: string;
  domainExpiryDate?: string;
  registrar?: string;
  lastChecked?: string;
}

export const checkSSL = (domain: string): Promise<SSLInfo> => {
  return new Promise((resolve, reject) => {
    const options = {
      host: domain,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 10000, // 10 saniye timeout
    };

    const req = https.request(options, (res) => {
      const cert = res.socket as tls.TLSSocket;
      const peerCertificate = cert.getPeerCertificate();

      if (peerCertificate) {
        try {
          // Geçerli tarih aralığını kontrol et
          const validFrom = new Date(peerCertificate.valid_from);
          const validTo = new Date(peerCertificate.valid_to);
          const now = new Date();

          // Tarihlerin geçerli olup olmadığını kontrol et
          if (isNaN(validFrom.getTime()) || isNaN(validTo.getTime())) {
            reject(new Error('Invalid certificate dates'));
            return;
          }

          const daysRemaining = Math.floor(
            (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const sslInfo: SSLInfo = {
            valid: daysRemaining > 0,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            daysRemaining,
            issuer: peerCertificate.issuer?.CN || 'Unknown',
            lastChecked: now.toISOString()
          };

          console.log('SSL Check Details:', {
            domain,
            validFrom: sslInfo.validFrom,
            validTo: sslInfo.validTo,
            now: now.toISOString(),
            daysRemaining: sslInfo.daysRemaining
          });

          resolve(sslInfo);
        } catch (error) {
          console.error('SSL parsing error for domain:', domain, error);
          reject(new Error(`Failed to parse SSL certificate dates for ${domain}`));
        }
      } else {
        reject(new Error(`No SSL certificate found for ${domain}`));
      }
    });

    req.on('error', (e) => {
      console.error(`SSL check failed for ${domain}:`, e.message);
      reject(new Error(`SSL check failed for ${domain}: ${e.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`SSL check timed out for ${domain}`));
    });

    req.end();
  });
};
