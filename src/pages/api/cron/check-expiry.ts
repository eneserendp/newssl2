import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { sendExpiryNotification } from '../../../utils/emailService';
import { checkSSL } from '../../../utils/sslChecker';
import { checkWhois } from '../../../utils/whoisChecker';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const settings = await prisma.settings.findFirst();
    const sslWarningThreshold = settings?.sslWarningThreshold || 20;
    const domainWarningThreshold = settings?.domainWarningThreshold || 30;
    
    // Saat kontrolü
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const scheduledTime = settings?.cronTime || '09:00';

    console.log('Time Check:', {
      currentTime,
      scheduledTime,
      timezone: process.env.TZ
    });

    if (scheduledTime === currentTime) {
      console.log('🔄 Starting daily updates...');
      const allDomains = await prisma.monitoredDomain.findMany();
      
      for (const domain of allDomains) {
        try {
          console.log(`Checking ${domain.domain}...`);
          const oldSslInfo = domain.sslInfo as any;
          
          // SSL ve WHOIS kontrollerini paralel yap
          const [sslInfo, whoisInfo] = await Promise.all([
            checkSSL(domain.domain),
            checkWhois(domain.domain).catch(err => ({
              domainExpiryDate: oldSslInfo?.domainExpiryDate,
              registrar: oldSslInfo?.registrar
            }))
          ]);
          
          // Bilgileri birleştir
          const sslInfoJson: Prisma.JsonObject = {
            ...sslInfo,
            domainExpiryDate: whoisInfo.domainExpiryDate || oldSslInfo?.domainExpiryDate,
            registrar: whoisInfo.registrar || oldSslInfo?.registrar,
            lastChecked: new Date().toISOString()
          };

          await prisma.monitoredDomain.update({
            where: { domain: domain.domain },
            data: { 
              sslInfo: sslInfoJson,
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ Updated ${domain.domain}:`, {
            ssl: `${oldSslInfo?.daysRemaining} -> ${sslInfo.daysRemaining} days`,
            domainExpiry: whoisInfo.domainExpiryDate || oldSslInfo?.domainExpiryDate,
            registrar: whoisInfo.registrar || oldSslInfo?.registrar
          });
        } catch (error) {
          console.error(`❌ Failed to update ${domain.domain}:`, error);
        }
      }

      console.log('🏁 Daily updates completed');
    }

    if (scheduledTime !== currentTime) {
      return res.status(200).json({ status: 'waiting' });
    }

    // Domain süresi kontrolünü düzelt
    const expiringDomains = await prisma.monitoredDomain.findMany({
      where: {
        OR: [
          {
            sslInfo: {
              path: ['daysRemaining'],
              lte: sslWarningThreshold,
              gt: 0
            }
          },
          {
            sslInfo: {
              path: ['domainExpiryDate'],
              gt: ''
            }
          }
        ]
      }
    });

    const domainsToNotify = expiringDomains.filter(domain => {
      const sslInfo = domain.sslInfo as any;
      const sslDaysRemaining = sslInfo.daysRemaining;
      
      // Domain expiry days calculation
      const domainExpiryDate = sslInfo.domainExpiryDate ? new Date(sslInfo.domainExpiryDate) : null;
      const now = new Date();
      const domainDaysRemaining = domainExpiryDate 
        ? Math.ceil((domainExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return (
        (sslDaysRemaining > 0 && sslDaysRemaining <= sslWarningThreshold) ||
        (domainDaysRemaining != null && domainDaysRemaining > 0 && domainDaysRemaining <= domainWarningThreshold)
      );
    });

    if (domainsToNotify.length > 0) {
      console.log(`📧 Sending notifications for ${domainsToNotify.length} domains`);
      await sendExpiryNotification(
        domainsToNotify.map(d => ({
          domain: d.domain,
          sslDaysRemaining: (d.sslInfo as any).daysRemaining,
          domainExpiryDate: (d.sslInfo as any).domainExpiryDate,
          registrar: (d.sslInfo as any).registrar
        }))
      );
      console.log('✅ Notifications sent successfully');
    }

    return res.status(200).json({ 
      status: 'completed',
      domainsChecked: domainsToNotify.length,
      emailsSentTo: settings?.recipients?.length || 0
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: 'Error checking expiry dates',
      details: error?.message 
    });
  }
}
