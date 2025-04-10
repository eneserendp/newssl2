import { useEffect, useState } from 'react';
import { prisma } from '../lib/prisma';

export default function DebugPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/domains')
      .then(res => res.json())
      .then(data => {
        setDomains(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl mb-4">Database Debug View</h1>
      <pre className="bg-gray-800 p-4 rounded-lg overflow-auto">
        {JSON.stringify(domains, null, 2)}
      </pre>
    </div>
  );
}
