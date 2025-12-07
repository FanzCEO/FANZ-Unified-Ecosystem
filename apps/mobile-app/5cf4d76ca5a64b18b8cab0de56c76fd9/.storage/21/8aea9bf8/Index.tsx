import { useState } from 'react';
import MobileNavigation from '@/components/MobileNavigation';
import MobileDashboard from '@/pages/MobileDashboard';
import MobileUpload from '@/pages/MobileUpload';
import MobileCompliance from '@/pages/MobileCompliance';
import MobileScheduler from '@/pages/MobileScheduler';
import MobileProfile from '@/pages/MobileProfile';

export default function Index() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <MobileDashboard onPageChange={setCurrentPage} />;
      case 'upload':
        return <MobileUpload onPageChange={setCurrentPage} />;
      case 'compliance':
        return <MobileCompliance onPageChange={setCurrentPage} />;
      case 'scheduler':
        return <MobileScheduler onPageChange={setCurrentPage} />;
      case 'profile':
        return <MobileProfile onPageChange={setCurrentPage} />;
      default:
        return <MobileDashboard onPageChange={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-sm mx-auto relative overflow-hidden">
      {/* Mobile Status Bar */}
      <div className="h-6 bg-black flex items-center justify-between px-4 text-white text-xs">
        <span>9:41</span>
        <div className="flex items-center space-x-1">
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>
      
      <main className="pb-20">
        {renderPage()}
      </main>
      
      <MobileNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
}