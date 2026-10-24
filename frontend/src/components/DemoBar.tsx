import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Role } from '../types';
import { api } from '../api';
import { 
  UserCheck, 
  Stethoscope, 
  Building2, 
  RotateCcw,
  CheckCircle2,
  Database,
  Moon,
  Sun,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoBar: React.FC = () => {
  const { role, switchRole, storageInfo, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // Exactly three production roles as specified
  const portalRoles: Array<{ id: Role; label: string; icon: any; route: string; persona: string }> = [
    { id: 'patient', label: 'Patient Portal', icon: UserCheck, route: '/patient', persona: 'Rohan Mehta' },
    { id: 'receptionist', label: 'Receptionist Portal', icon: Building2, route: '/reception', persona: 'Front Desk Operations' },
    { id: 'doctor', label: 'Doctor Portal', icon: Stethoscope, route: '/doctor', persona: 'Dr. Rajesh Sharma' },
  ];

  const handleRoleClick = async (targetRole: Role, targetRoute: string) => {
    await switchRole(targetRole);
    navigate(targetRoute);
  };

  const handleResetData = async () => {
    if (!confirm('Reset demonstration data to baseline? This restores synthetic appointments, doctors, and queues.')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoData();
      await refreshUser();
      setResetMsg('Data baseline restored successfully.');
      setTimeout(() => setResetMsg(null), 3000);
      window.location.reload();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const isAtlas = storageInfo?.is_atlas;

  return (
    <div className="bg-[#15151F] text-[#F4F2FA] border-b border-[#343347] text-xs px-4 py-2 sticky top-0 z-50 shadow-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Role Portal Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-[#A78BFA] bg-[#29213D] px-2.5 py-1 rounded-md border border-[#343347]">
            <span className="tracking-wide uppercase text-[10px]">Clinic Portals</span>
          </div>

          <div className="flex items-center gap-1 bg-[#1B1B28] p-0.5 rounded-lg border border-[#343347]">
            {portalRoles.map((cfg) => {
              const Icon = cfg.icon;
              const isActive = role === cfg.id;
              return (
                <button
                  key={cfg.id}
                  onClick={() => handleRoleClick(cfg.id, cfg.route)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-[#8B5CF6] text-white shadow-xs font-semibold'
                      : 'text-[#AAA6BC] hover:text-[#F4F2FA] hover:bg-[#222233]'
                  }`}
                  title={`Switch to ${cfg.persona}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Theme Toggle, Storage Engine, and Baseline Reset */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle (Moon / Sun) */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1B1B28] hover:bg-[#222233] border border-[#343347] text-[#F4F2FA] transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle dark/light mode"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span className="text-[11px] font-medium text-[#AAA6BC]">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-[#AAA6BC]">Light</span>
              </>
            )}
          </button>

          {/* Database Engine Indicator */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${
              isAtlas 
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300' 
                : 'bg-violet-950/70 border-violet-700 text-violet-300'
            }`}
            title={storageInfo?.description || 'Storage Engine'}
          >
            <Database className="w-3 h-3" />
            <span>{isAtlas ? 'MongoDB Atlas' : 'Embedded JSON Store'}</span>
          </div>

          {/* Seed Reset */}
          <button
            onClick={handleResetData}
            disabled={resetting}
            className="flex items-center gap-1 bg-[#1B1B28] hover:bg-[#222233] text-[#AAA6BC] hover:text-[#F4F2FA] px-2.5 py-1 rounded border border-[#343347] transition-colors disabled:opacity-50 text-[11px]"
            title="Reset data to initial baseline"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Data'}</span>
          </button>

          {resetMsg && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium animate-fade-in text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              {resetMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
