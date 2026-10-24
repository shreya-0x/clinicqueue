import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DemoBar } from './components/DemoBar';
import { Navbar } from './components/Navbar';
import { LandingView } from './views/LandingView';
import { DemoCentreView } from './views/DemoCentreView';
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
        <div className="min-h-screen flex flex-col bg-[#f4f8f8] font-sans text-[#1b2b34]">
          {/* Top Hackathon Judge Demo Switcher Bar */}
          <DemoBar />

          {/* Standard Navigation Bar */}
          <Navbar />

          {/* Application Views */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingView />} />
              <Route path="/demo-centre" element={<DemoCentreView />} />
              <Route path="/patient" element={<PatientView />} />
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

          {/* Minimalist Footer */}
          <footer className="bg-white border-t border-[#d5dfe3] py-6 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1b2b34]">ClinicQueue</span>
                <span>• Innovators Conclave 2026 Hackathon Edition</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Adaptive Wait-Time Prediction</span>
                <span>• Clinic-Day Digital Twin</span>
                <span>• Live Queue Orchestrator</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
