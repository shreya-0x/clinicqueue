import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { ShieldAlert, LogOut, ArrowRight, Activity, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, loading, token, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md animate-pulse">
            <Activity className="w-5 h-5 animate-spin" />
          </div>
          <p className="text-xs font-medium text-[#AAA6BC] light:text-[#625D74]">
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
      <div className="min-h-screen flex items-center justify-center bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] px-4">
        <div className="max-w-md w-full bg-[#1B1B28] light:bg-white rounded-2xl border border-red-900/40 light:border-red-200 p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 light:bg-red-50 border border-red-800 light:border-red-200 flex items-center justify-center text-red-400 light:text-red-600 mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-[#F4F2FA] light:text-[#242033]">
            Access Restricted
          </h2>

          <p className="mt-2 text-xs text-[#AAA6BC] light:text-[#625D74] leading-relaxed">
            You are currently authenticated as <strong className="text-[#F4F2FA] light:text-[#242033]">{user.name}</strong> ({user.role}). This section requires <span className="font-semibold text-red-400 light:text-red-600">{allowedRoles.join(' / ')}</span> authorization.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => navigate(userRoleDashboard, { replace: true })}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>Return to My Dashboard ({user.role})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-xl border border-[#343347] light:border-[#DDD9E9] bg-[#222233] hover:bg-[#29293E] light:bg-[#F0EFF7] light:hover:bg-[#EAE7F1] text-[#AAA6BC] hover:text-[#F4F2FA] light:text-[#625D74] light:hover:text-[#242033] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Role / Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;