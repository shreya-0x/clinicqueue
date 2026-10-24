import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Role } from '../types';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Building2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Stethoscope,
  Sun,
  User,
  UserCheck,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface RoleConfig {
  role: Role;
  name: string;
  badge: string;
  desc: string;
  icon: any;
  targetRoute: string;
  demoEmail: string;
  demoPassword: string;
  demoPersona: string;
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  patient: {
    role: 'patient',
    name: 'Patient Portal',
    badge: 'Patient Access',
    desc: 'Access your appointments, live queue tracking, and digital medical records.',
    icon: UserCheck,
    targetRoute: '/patient',
    demoEmail: 'patient@clinicqueue.demo',
    demoPassword: 'Demo123!',
    demoPersona: 'Rohan Mehta (Patient)'
  },
  doctor: {
    role: 'doctor',
    name: 'Doctor Portal',
    badge: 'Clinical Staff Access',
    desc: 'Review assigned patients, call the next in line, and update consultation durations.',
    icon: Stethoscope,
    targetRoute: '/doctor',
    demoEmail: 'doctor.sharma@clinicqueue.demo',
    demoPassword: 'Demo123!',
    demoPersona: 'Dr. Rajesh Sharma (Cardiology)'
  },
  receptionist: {
    role: 'receptionist',
    name: 'Receptionist Portal',
    badge: 'Front Desk Access',
    desc: 'Orchestrate arrivals, manage walk-in patients, and monitor clinic-wide operations.',
    icon: Building2,
    targetRoute: '/reception',
    demoEmail: 'reception@clinicqueue.demo',
    demoPassword: 'Demo123!',
    demoPersona: 'Ananya Sen (Reception Desk)'
  }
};

export const AuthView: React.FC = () => {
  const { portalRole } = useParams<{ portalRole: string }>();
  const navigate = useNavigate();
  const { login, register, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const validRoleKey = portalRole && ROLE_CONFIGS[portalRole.toLowerCase()] ? portalRole.toLowerCase() : 'patient';
  const config = ROLE_CONFIGS[validRoleKey];
  const Icon = config.icon;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>(32);
  const [gender, setGender] = useState('Male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const loggedInUser = await login(email, password);
        // Authorization check
        if (loggedInUser.role !== config.role) {
          setError(
            `Account role mismatch: This account belongs to the "${loggedInUser.role}" role, but you are signing into the "${config.name}". Redirecting to your assigned portal...`
          );
          setTimeout(() => {
            const redirectPath = loggedInUser.role === 'receptionist' ? '/reception' : `/${loggedInUser.role}`;
            navigate(redirectPath, { replace: true });
          }, 1500);
          return;
        }
        navigate(config.targetRoute, { replace: true });
      } else {
        // Patient registration
        if (!name.trim() || !email.trim() || !password) {
          setError('Please provide full name, email, and password.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          age: typeof age === 'number' ? age : undefined,
          gender
        });
        setSuccessMsg('Patient account registered successfully. Entering portal...');
        setTimeout(() => {
          navigate(config.targetRoute, { replace: true });
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await switchRole(config.role);
      navigate(config.targetRoute, { replace: true });
    } catch (err: any) {
      setError(`Demo switch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoCreds = () => {
    setEmail(config.demoEmail);
    setPassword(config.demoPassword);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1020] light:bg-[#F8FAFC] text-[#F1F5F9] light:text-[#0F172A] transition-colors duration-150">
      {/* Top Header */}
      <header className="border-b border-[#29344D] light:border-[#E2E8F0] bg-[#0F172A] light:bg-white h-14 flex items-center transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] light:text-[#475569] hover:text-[#60A5FA] light:hover:text-[#2563EB] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal Selection</span>
          </Link>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] flex items-center justify-center text-[#60A5FA] light:text-[#2563EB]">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">ClinicQueue</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 rounded-lg border border-[#29344D] light:border-[#E2E8F0] bg-[#151D31] light:bg-[#F1F5F9] text-[#94A3B8] light:text-[#475569] hover:text-[#F1F5F9] light:hover:text-[#0F172A] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#FBBF24]" /> : <Moon className="w-3.5 h-3.5 text-[#2563EB]" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Role Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] text-[#60A5FA] light:text-[#2563EB] mb-3 shadow-xs">
              <Icon className="w-6 h-6" />
            </div>

            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#151D31] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB] border border-[#29344D] light:border-[#BFDBFE] mb-2">
              {config.badge}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9] light:text-[#0F172A]">
              {mode === 'login' ? `${config.name} Sign In` : 'New Patient Registration'}
            </h1>
            <p className="mt-1 text-xs text-[#94A3B8] light:text-[#475569]">
              {config.desc}
            </p>
          </div>

          {/* Mode Switcher (Patient only) */}
          {config.role === 'patient' && (
            <div className="flex bg-[#0F172A] light:bg-[#F1F5F9] p-1 rounded-lg mb-4 border border-[#29344D] light:border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  mode === 'login'
                    ? 'bg-[#60A5FA] text-[#0B1020] shadow-xs'
                    : 'text-[#94A3B8] light:text-[#475569] hover:text-[#F1F5F9] light:hover:text-[#0F172A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  mode === 'register'
                    ? 'bg-[#60A5FA] text-[#0B1020] shadow-xs'
                    : 'text-[#94A3B8] light:text-[#475569] hover:text-[#F1F5F9] light:hover:text-[#0F172A]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-md">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rohan Mehta"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-[#F1F5F9] light:text-[#0F172A] text-xs focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-[#F1F5F9] light:text-[#0F172A] text-xs focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-[#F1F5F9] light:text-[#0F172A] text-xs focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={config.demoEmail}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-[#F1F5F9] light:text-[#0F172A] text-xs focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569]">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={handleFillDemoCreds}
                      className="text-[11px] text-[#60A5FA] light:text-[#2563EB] hover:underline"
                    >
                      Fill Demo Credentials
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-[#F1F5F9] light:text-[#0F172A] text-xs focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] disabled:opacity-50 text-[#0B1020] light:text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? `Sign In to ${config.name}` : 'Create Patient Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Button */}
            <div className="mt-5 pt-4 border-t border-[#1E293B] light:border-[#E2E8F0]">
              <div className="text-center mb-2.5">
                <span className="text-[10px] text-[#64748B] light:text-[#64748B] uppercase tracking-wider font-semibold">
                  Or Test With Demo Account
                </span>
              </div>

              <button
                type="button"
                onClick={handleInstantDemo}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg border border-[#29344D] light:border-[#E2E8F0] bg-[#1B263D] hover:bg-[#22304C] light:bg-[#F1F5F9] light:hover:bg-[#E2E8F0] text-[#F1F5F9] light:text-[#0F172A] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#60A5FA] light:text-[#2563EB]" />
                <span>Instant Access as {config.demoPersona}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthView;