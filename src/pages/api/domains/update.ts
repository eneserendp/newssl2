import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { checkSSL } from '../../../utils/sslChecker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, manualSslInfo } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    let sslInfo;
    
    if (manualSslInfo) {
      sslInfo = manualSslInfo;
    } else {
      sslInfo = await checkSSL(domain);
    }

    const updatedDomain = await prisma.monitoredDomain.update({
      where: { domain },
      data: { 
        sslInfo,
        updatedAt: new Date()
      },
    });

    return res.status(200).json({
      domain: updatedDomain.domain,
      sslInfo: updatedDomain.sslInfo,
      addedAt: updatedDomain.createdAt,
    });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Error updating domain SSL info' });
  }
}
