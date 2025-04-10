import { ReactNode } from 'react';
import { Navbar } from '../dashboard/Navbar';
import { useRouter } from 'next/router';

interface DashboardLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function DashboardLayout({ children, showSidebar = false }: DashboardLayoutProps) {
  const router = useRouter();
  const isDashboard = router.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navbar showBackButton={!isDashboard} />
      <main className="p-4 max-w-8xl mx-auto mt-20">
        {children}
      </main>
    </div>
  );
}
