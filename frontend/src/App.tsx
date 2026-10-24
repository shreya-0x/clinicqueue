import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DemoBar } from './components/DemoBar';
import { Navbar } from './components/Navbar';
import { LandingView } from './views/LandingView';
import { PatientView } from './views/PatientView';
import { PrescriptionsView } from './views/PrescriptionsView';
import { ProfileView } from './views/ProfileView';
import { ReceptionView } from './views/ReceptionView';
import { DoctorView } from './views/DoctorView';
import { AdminView } from './views/AdminView';
import { PlatformView } from './views/PlatformView';
import { HospitalsView } from './views/HospitalsView';
import { QueueBoardView } from './views/QueueBoardView';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] font-sans transition-colors duration-200">
          {/* Top Quick Role Switcher Bar */}
          <DemoBar />

          {/* Standard Navigation Bar */}
          <Navbar />

          {/* Application Portals & Views */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingView />} />
              <Route path="/patient" element={<PatientView />} />
              <Route path="/patient/visits" element={<PatientView />} />
              <Route path="/prescriptions" element={<PrescriptionsView />} />
              <Route path="/patient/prescriptions" element={<PrescriptionsView />} />
              <Route path="/insurance" element={<ProfileView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/patient/profile" element={<ProfileView />} />
              <Route path="/reception" element={<ReceptionView />} />
              <Route path="/doctor" element={<DoctorView />} />
              <Route path="/admin" element={<AdminView />} />
              <Route path="/platform" element={<PlatformView />} />
              <Route path="/hospitals" element={<HospitalsView />} />
              <Route path="/queue-board" element={<QueueBoardView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Professional Footer */}
          <footer className="bg-[#15151F] light:bg-white border-t border-[#343347] light:border-[#DDD9E9] py-6 text-xs text-[#817C95] light:text-[#777188] transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F4F2FA] light:text-[#242033]">ClinicQueue</span>
                <span>• Outpatient Operations & Predictive Analytics Platform</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Adaptive Wait-Time Prediction</span>
                <span>• Clinic-Day Digital Twin</span>
                <span>• Live Queue Orchestration</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
