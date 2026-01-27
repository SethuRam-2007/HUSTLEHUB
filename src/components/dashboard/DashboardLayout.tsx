import React from 'react';
import { motion } from 'framer-motion';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const DashboardLayout = ({ children, showSidebar = true }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <DashboardTopBar />
      
      {/* Spacer to account for fixed header (h-20 + mt-4 = 96px, plus extra breathing room) */}
      <div className="h-28" />
      
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && <DashboardSidebar />}
        
        {/* Main Content */}
        <motion.main 
          className={`flex-1 min-h-[calc(100vh-112px)] ${showSidebar ? 'lg:ml-64' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;