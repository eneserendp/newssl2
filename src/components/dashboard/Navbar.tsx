import { BellIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavbarProps {
  showBackButton?: boolean;
}

export function Navbar({ showBackButton = false }: NavbarProps) {
  const router = useRouter();

  return (
    <div className="h-20 bg-[#1E293B]/90 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4">
        {showBackButton ? (
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <Image
              src="/niltek.png"
              alt="Niltek Logo"
              width={130}  // 48'den 64'e yükseltildi
              height={0} // 48'den 64'e yükseltildi
              className="object-contain"
            />
          </Link>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            2
          </span>
        </button>
        
        <div className="h-8 w-[1px] bg-gray-700 mx-2" />
        
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-white">Admin</span>
            <span className="text-xs text-gray-400">Super Admin</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
