import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PortalLayout } from './components/PortalLayout';
import { LandingView } from './views/LandingView';
import { AuthView } from './views/AuthView';
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
        <Routes>
          {/* 1. Initial Entry Point: Uncluttered Landing Screen with 3 Portal Cards */}
          <Route path="/" element={<LandingView />} />

          {/* 2. Distinct, Refresh-Safe Authentication Routes */}
          <Route path="/login/:portalRole" element={<AuthView />} />

          {/* 3. Internal Application Shell for Authenticated Portals */}
          <Route element={<PortalLayout />}>
            {/* Patient Portal Routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PatientView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/visits"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PatientView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PrescriptionsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PrescriptionsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <ProfileView />
                </ProtectedRoute>
              }
            />

            {/* Doctor Portal Routes */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'platform_admin']}>
                  <DoctorView />
                </ProtectedRoute>
              }
            />

            {/* Receptionist Portal Routes */}
            <Route
              path="/reception"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />

            {/* Shared Clinical Utilities */}
            <Route path="/queue-board" element={<QueueBoardView />} />
            <Route path="/hospitals" element={<HospitalsView />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'platform_admin']}>
                  <AdminView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/platform"
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <PlatformView />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect to portal selection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;