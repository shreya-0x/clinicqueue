import React from 'react';
import { Outlet } from 'react-router-dom';
import { PortalNavbar } from './PortalNavbar';

export const PortalLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] font-sans transition-colors duration-200">
      <PortalNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[#15151F] light:bg-white border-t border-[#343347] light:border-[#DDD9E9] py-5 text-xs text-[#817C95] light:text-[#777188] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F4F2FA] light:text-[#242033]">ClinicQueue</span>
            <span>• Outpatient Operations & Predictive Analytics</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Adaptive Wait-Time Prediction</span>
            <span>•</span>
            <span>Clinic-Day Digital Twin</span>
            <span>•</span>
            <span>Live Queue Orchestration</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortalLayout;