import type { NextApiRequest, NextApiResponse } from 'next';
import { checkSSL } from '../../utils/sslChecker';
import { checkWhois } from '../../utils/whoisChecker';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

// İstek kilitlerini tutmak için Map
const lockMap = new Map<string, boolean>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, forceCheck } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  // Eğer domain için işlem devam ediyorsa, beklemede olduğunu bildir
  if (lockMap.get(domain)) {
    return res.status(429).json({ 
      error: 'Domain check in progress', 
      message: 'Please wait for the previous check to complete' 
    });
  }

  try {
    // Domain için kilidi aktifleştir
    lockMap.set(domain, true);

    const existingDomain = await prisma.monitoredDomain.findUnique({
      where: { domain }
    });

    const lastChecked = existingDomain?.updatedAt;
    const cooldownPeriod = 5 * 60 * 1000; // 5 dakika
    const now = new Date();
    
    // Ön bellek kontrolü
    if (!forceCheck && 
        existingDomain?.sslInfo && 
        lastChecked && 
        (now.getTime() - lastChecked.getTime()) < cooldownPeriod) {
      console.log(`Using cached SSL info for ${domain} (last checked: ${lastChecked})`);
      return res.status(200).json(existingDomain.sslInfo);
    }

    // Yeni SSL ve WHOIS kontrolü
    console.log(`Fetching fresh SSL and WHOIS info for ${domain}...`);
    const [sslInfo, whoisInfo] = await Promise.all([
      checkSSL(domain),
      checkWhois(domain)
    ]);

    // SSL verilerini ve whois bilgilerini birleştir
    const sslInfoJson: Prisma.JsonObject = {
      valid: sslInfo.valid,
      validFrom: sslInfo.validFrom,
      validTo: sslInfo.validTo,
      daysRemaining: sslInfo.daysRemaining,
      issuer: sslInfo.issuer,
      lastChecked: now.toISOString(),
      domainExpiryDate: whoisInfo.domainExpiryDate,
      registrar: whoisInfo.registrar
    };

    // SSL ve WHOIS verilerini logla
    console.log('SSL Check Details:', {
      domain,
      validFrom: sslInfo.validFrom,
      validTo: sslInfo.validTo,
      now: new Date().toISOString(),
      daysRemaining: sslInfo.daysRemaining,
      domainExpiryDate: whoisInfo.domainExpiryDate,
      registrar: whoisInfo.registrar
    });

    // SSL verilerini doğrula
    if (!sslInfo || typeof sslInfo.daysRemaining !== 'number') {
      throw new Error('Invalid SSL info received');
    }

    // Veritabanını güncelle
    const updatedDomain = await prisma.monitoredDomain.upsert({
      where: { domain },
      update: { 
        sslInfo: sslInfoJson,
        updatedAt: now
      },
      create: {
        domain,
        sslInfo: sslInfoJson
      }
    });

    console.log(`SSL info updated for ${domain}: ${sslInfo.daysRemaining} days remaining`);
    return res.status(200).json(updatedDomain.sslInfo);

  } catch (error: any) {
    console.error(`SSL check error for ${domain}:`, error);
    return res.status(500).json({ 
      error: error?.message || 'SSL check failed',
      domain 
    });
  } finally {
    // İşlem bittiğinde kilidi kaldır
    lockMap.set(domain, false);
  }
}
