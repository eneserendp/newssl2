import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { ModuleCard } from '../../components/dashboard/ModuleCard';
import { 
  GlobeAltIcon, 
  ServerIcon, 
  ArrowPathIcon,
  DocumentArrowDownIcon 
} from '@heroicons/react/24/outline';

const modules = [
  {
    title: "SSL Checker",
    description: "Domain ve SSL sertifikalarının takibi",
    icon: GlobeAltIcon,
    path: "/ssl-checker",
    color: "blue"
  },
  {
    title: "Sistem Devir Test",
    description: "Sistem devir takip ve yönetimi",
    icon: ArrowPathIcon,
    path: "/system-transfer",
    color: "green"
  },
  {
    title: "Sunucu Takipci",
    description: "Sunucu durumu ve performans takibi",
    icon: ServerIcon,
    path: "/server-monitor",
    color: "purple"
  },
  {
    title: "Format Dönüştürücü",
    description: "Dosya format dönüşümleri",
    icon: DocumentArrowDownIcon,
    path: "/format-converter",
    color: "orange"
  }
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.path} {...module} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
