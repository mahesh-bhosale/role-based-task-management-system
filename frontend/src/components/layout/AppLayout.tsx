import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  // Default to true on desktop, false on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col min-h-screen max-w-full transition-all duration-200 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        <Header isSidebarOpen={isSidebarOpen} onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 mt-16 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
