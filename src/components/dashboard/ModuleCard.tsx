import Link from 'next/link';
import { ElementType } from 'react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ElementType;
  path: string;
  color: string;
}

export function ModuleCard({ title, description, icon: Icon, path, color }: ModuleCardProps) {
  return (
    <Link href={path} className="block transform hover:scale-105 transition-all duration-200">
      <div className="glass-effect rounded-2xl p-8 hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer h-full">
        <div className={`w-16 h-16 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-6`}>
          <Icon className={`w-8 h-8 text-${color}-500`} />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
