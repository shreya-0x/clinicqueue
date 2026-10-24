import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { ShieldAlert, LogOut, ArrowRight, Activity } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, loading, token, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1020] light:bg-[#F8FAFC] text-[#F1F5F9] light:text-[#0F172A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] flex items-center justify-center text-[#60A5FA] light:text-[#2563EB] shadow-xs animate-pulse">
            <Activity className="w-5 h-5 animate-spin" />
          </div>
          <p className="text-xs font-medium text-[#94A3B8] light:text-[#475569]">
            Verifying clinical session authorization...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated: redirect to the login route for the primary allowed role
  if (!token || !user) {
    const targetRole = allowedRoles[0] || 'patient';
    return <Navigate to={`/login/${targetRole}`} replace />;
  }

  // Authenticated, but role does not match permissions for this view
  if (!allowedRoles.includes(user.role)) {
    const userRoleDashboard = user.role === 'receptionist' ? '/reception' : `/${user.role}`;

    const handleSignOut = () => {
      logout();
      navigate('/', { replace: true });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1020] light:bg-[#F8FAFC] text-[#F1F5F9] light:text-[#0F172A] px-4">
        <div className="max-w-md w-full bg-[#151D31] light:bg-white rounded-xl border border-red-900/40 light:border-red-200 p-6 sm:p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-red-950/40 light:bg-red-50 border border-red-800 light:border-red-200 flex items-center justify-center text-red-400 light:text-red-600 mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-[#F1F5F9] light:text-[#0F172A]">
            Portal Access Restricted
          </h2>

          <p className="mt-2 text-xs text-[#94A3B8] light:text-[#475569] leading-relaxed">
            You are currently signed in as <strong className="text-[#F1F5F9] light:text-[#0F172A]">{user.name}</strong> with the <span className="capitalize font-semibold text-[#60A5FA] light:text-[#2563EB]">{user.role}</span> role. You do not have authorization to access the <span className="font-semibold text-red-400 light:text-red-600">{allowedRoles.join(' / ')}</span> portal.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => navigate(userRoleDashboard, { replace: true })}
              className="w-full py-2.5 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] text-[#0B1020] light:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>Return to My Dashboard ({user.role})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-lg border border-[#29344D] light:border-[#E2E8F0] bg-[#1B263D] hover:bg-[#22304C] light:bg-[#F1F5F9] light:hover:bg-[#E2E8F0] text-[#94A3B8] hover:text-[#F1F5F9] light:text-[#475569] light:hover:text-[#0F172A] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Portal / Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;