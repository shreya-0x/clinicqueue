import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { api } from '../api';
import { 
  Sparkles, 
  UserCheck, 
  Stethoscope, 
  ShieldCheck, 
  Building2, 
  Compass, 
  RotateCcw,
  CheckCircle2,
  Database,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoBar: React.FC = () => {
  const { user, role, switchRole, storageInfo, refreshUser } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const roleConfigs: Array<{ id: Role; label: string; icon: any; route: string; persona: string }> = [
    { id: 'patient', label: 'Patient', icon: UserCheck, route: '/patient', persona: 'Rohan Mehta' },
    { id: 'receptionist', label: 'Receptionist', icon: Building2, route: '/reception', persona: 'Ananya (Front Desk)' },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, route: '/doctor', persona: 'Dr. Rajesh Sharma' },
    { id: 'hospital_admin', label: 'Hospital Admin', icon: ShieldCheck, route: '/admin', persona: 'MetroCare Apex' },
    { id: 'platform_admin', label: 'Platform Admin', icon: Compass, route: '/platform', persona: 'National Directory' },
  ];

  const handleRoleClick = async (targetRole: Role, targetRoute: string) => {
    await switchRole(targetRole);
    navigate(targetRoute);
  };

  const handleResetData = async () => {
    if (!confirm('Reset demo dataset to initial baseline? All seeded appointments and active queue will be restored.')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoData();
      await refreshUser();
      setResetMsg('Demo state reset successfully!');
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
    <div className="bg-navy-950 text-white border-b border-navy-800 text-xs px-4 py-2 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Hackathon Judge Quick-Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-brand-400 bg-navy-900/80 px-2.5 py-1 rounded-md border border-navy-700">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="tracking-wide uppercase text-[10px] font-semibold text-brand-300">Hackathon Demo Mode</span>
          </div>

          <div className="flex items-center gap-1 bg-navy-900 p-0.5 rounded-lg border border-navy-800">
            {roleConfigs.map((cfg) => {
              const Icon = cfg.icon;
              const isActive = role === cfg.id;
              return (
                <button
                  key={cfg.id}
                  onClick={() => handleRoleClick(cfg.id, cfg.route)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-semibold'
                      : 'text-navy-300 hover:text-white hover:bg-navy-800'
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

          <button
            onClick={() => navigate('/demo-centre')}
            className="flex items-center gap-1 text-brand-300 hover:text-white hover:underline ml-2 transition-colors"
          >
            <span>5-Min Tour Guide</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Right: Storage Engine Indicator & Reset Controls */}
        <div className="flex items-center gap-3">
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${
              isAtlas 
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300' 
                : 'bg-amber-950/70 border-amber-800 text-amber-300'
            }`}
            title={storageInfo?.description || 'Storage Engine'}
          >
            <Database className="w-3 h-3" />
            <span>{isAtlas ? 'MongoDB Atlas (Connected)' : 'Embedded Storage (Offline Mode)'}</span>
          </div>

          <button
            onClick={handleResetData}
            disabled={resetting}
            className="flex items-center gap-1 bg-navy-800 hover:bg-navy-700 text-navy-200 px-2 py-1 rounded border border-navy-700 transition-colors disabled:opacity-50"
            title="Reset database to initial seed"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Seed'}</span>
          </button>

          {resetMsg && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium animate-fade-in">
              <CheckCircle2 className="w-3 h-3" />
              {resetMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
