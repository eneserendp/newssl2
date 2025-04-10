import type { NextApiRequest, NextApiResponse } from 'next';
import { checkSSL } from '../../utils/sslChecker';
import { checkWhois } from '../../utils/whoisChecker';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { SSLInfo } from '../../types/domain';

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

    console.log(`Fetching fresh SSL info for ${domain}...`);

    // Get existing domain info
    const existingDomain = await prisma.monitoredDomain.findUnique({
      where: { domain }
    });

    // Type assertion for sslInfo
    const existingSslInfo = existingDomain?.sslInfo as SSLInfo | undefined;

    const lastChecked = existingDomain?.updatedAt;
    const cooldownPeriod = 5 * 60 * 1000; // 5 dakika
    const now = new Date();
    
    // Ön bellek kontrolü
    if (!forceCheck && 
        existingSslInfo && 
        lastChecked && 
        (now.getTime() - lastChecked.getTime()) < cooldownPeriod) {
      console.log(`Using cached SSL info for ${domain} (last checked: ${lastChecked})`);
      return res.status(200).json(existingSslInfo);
    }

    // Get fresh SSL info
    const sslInfo = await checkSSL(domain);

    // Try to get WHOIS info with proper types
    const whoisInfo = await checkWhois(domain).catch(() => ({
      domainExpiryDate: existingSslInfo?.domainExpiryDate,
      registrar: existingSslInfo?.registrar
    }));

    // Combine with proper typing
    const sslInfoJson: Prisma.JsonObject = {
      ...sslInfo,
      domainExpiryDate: whoisInfo.domainExpiryDate || existingSslInfo?.domainExpiryDate,
      registrar: whoisInfo.registrar || existingSslInfo?.registrar,
      lastChecked: new Date().toISOString()
    };

    // Update database
    const updatedDomain = await prisma.monitoredDomain.upsert({
      where: { domain },
      update: { 
        sslInfo: sslInfoJson,
        updatedAt: new Date()
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
