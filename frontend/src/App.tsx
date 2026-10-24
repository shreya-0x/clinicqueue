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
import { HospitalsView } from './views/HospitalsView';
import { QueueBoardView } from './views/QueueBoardView';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* 1. Base Entry Point: Uncluttered Landing with exactly 3 cards */}
          <Route path="/" element={<LandingView />} />

          {/* 2. Authentication Routes with Role-Specific Login/Register */}
          <Route path="/login/:portalRole" element={<AuthView />} />

          {/* 3. Authenticated Portal Layout with Left-Side Navigation */}
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
              path="/patient/book"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PatientView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PatientView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/tracker"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PatientView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/history"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PatientView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/notifications"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PatientView />
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
            <Route
              path="/patient/settings"
              element={
                <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                  <PatientView />
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
            <Route
              path="/doctor/schedule"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'platform_admin']}>
                  <DoctorView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/queue"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'platform_admin']}>
                  <DoctorView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/consultations"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'platform_admin']}>
                  <DoctorView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'platform_admin']}>
                  <DoctorView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/availability"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'platform_admin']}>
                  <DoctorView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/analytics"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'platform_admin']}>
                  <DoctorView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/settings"
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
            <Route
              path="/reception/appointments"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/patients"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/checkin"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/queue"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/doctors"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/analytics"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/simulator"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/settings"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'platform_admin']}>
                  <ReceptionView />
                </ProtectedRoute>
              }
            />

            {/* Shared Views accessible via Portal Shell */}
            <Route path="/hospitals" element={<HospitalsView />} />
            <Route path="/prescriptions" element={<PrescriptionsView />} />
            <Route path="/profile" element={<ProfileView />} />
          </Route>

          {/* Standalone Public Queue Board (waiting room TV display) */}
          <Route path="/queue-board" element={<QueueBoardView />} />

          {/* Catch-all redirect to portal selection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;