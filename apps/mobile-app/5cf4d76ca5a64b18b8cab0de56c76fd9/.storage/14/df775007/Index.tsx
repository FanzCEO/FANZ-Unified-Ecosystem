import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import Compliance from '@/pages/Compliance';
import Scheduler from '@/pages/Scheduler';
import Admin from '@/pages/Admin';

export default function Index() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={setCurrentPage} />;
      case 'upload':
        return <Upload onPageChange={setCurrentPage} />;
      case 'compliance':
        return <Compliance onPageChange={setCurrentPage} />;
      case 'scheduler':
        return <Scheduler onPageChange={setCurrentPage} />;
      case 'admin':
        return <Admin onPageChange={setCurrentPage} />;
      default:
        return <Dashboard onPageChange={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="pb-8">
        {renderPage()}
      </main>
    </div>
  );
}