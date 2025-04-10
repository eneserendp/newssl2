import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const settings = await prisma.settings.findFirst();
      res.status(200).json(settings || { 
        cronTime: '09:00', 
        recipients: [],
        sslWarningThreshold: 20,
        domainWarningThreshold: 30
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Error fetching settings' });
    }
  } 
  else if (req.method === 'POST') {
    const { cronTime, recipients, sslWarningThreshold, domainWarningThreshold } = req.body;

    try {
      const settings = await prisma.settings.upsert({
        where: { id: 1 },
        update: { 
          cronTime, 
          recipients,
          sslWarningThreshold: parseInt(sslWarningThreshold) || 20,
          domainWarningThreshold: parseInt(domainWarningThreshold) || 30
        },
        create: { 
          id: 1, 
          cronTime, 
          recipients,
          sslWarningThreshold: parseInt(sslWarningThreshold) || 20,
          domainWarningThreshold: parseInt(domainWarningThreshold) || 30
        },
      });

      console.log('Settings updated:', settings);
      res.status(200).json(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Error saving settings' });
    }
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
