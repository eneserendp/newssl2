import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain } = req.query;

  try {
    await prisma.monitoredDomain.delete({
      where: { domain: domain as string },
    });
    res.status(200).json({ message: 'Domain removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error removing domain' });
  }
}
