import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const domains = await prisma.monitoredDomain.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(domains.map(d => ({
        domain: d.domain,
        sslInfo: d.sslInfo,
        addedAt: d.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ error: 'Error fetching domains' });
    }
  } 
  else if (req.method === 'POST') {
    const { domain, sslInfo } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    try {
      // SSL bilgisi olmasa bile domaini ekle
      const newDomain = await prisma.monitoredDomain.create({
        data: {
          domain,
          sslInfo: sslInfo || {
            valid: true,
            validFrom: new Date().toISOString(),
            validTo: new Date().toISOString(),
            daysRemaining: 0,
            issuer: 'Manually Added'
          },
        },
      });
      
      res.status(201).json({
        domain: newDomain.domain,
        sslInfo: newDomain.sslInfo,
        addedAt: newDomain.createdAt,
      });
    } catch (error) {
      res.status(500).json({ error: 'Error adding domain' });
    }
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
