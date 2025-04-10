import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  GlobeAltIcon, 
  ServerIcon, 
  ArrowPathIcon,
  DocumentArrowDownIcon 
} from '@heroicons/react/24/outline';

const menuItems = [
  {
    title: "SSL Checker",
    icon: GlobeAltIcon,
    path: "/ssl-checker"
  },
  {
    title: "Sistem Devir",
    icon: ArrowPathIcon,
    path: "/system-transfer"
  },
  {
    title: "Sunucu Takip",
    icon: ServerIcon,
    path: "/server-monitor"
  },
  {
    title: "Format Dönüştürücü",
    icon: DocumentArrowDownIcon,
    path: "/format-converter"
  }
];

export function Sidebar() {
  const router = useRouter();
  
  return (
    <div className="w-64 bg-[#1E293B] h-screen p-4">
      <div className="mb-8 p-4">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = router.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-500' 
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
