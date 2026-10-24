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
  Calendar,
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
  color: string;
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
    demoPersona: 'Rohan Mehta (Patient)',
    color: '#8B5CF6'
  },
  doctor: {
    role: 'doctor',
    name: 'Doctor Portal',
    badge: 'Clinical Access',
    desc: 'Review assigned patients, call the next in line, and update consultation durations.',
    icon: Stethoscope,
    targetRoute: '/doctor',
    demoEmail: 'doctor.sharma@clinicqueue.demo',
    demoPassword: 'Demo123!',
    demoPersona: 'Dr. Rajesh Sharma (Cardiology)',
    color: '#7C3AED'
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
    demoPersona: 'Ananya Sen (Reception Desk)',
    color: '#6D28D9'
  }
};

export const AuthView: React.FC = () => {
  const { portalRole } = useParams<{ portalRole: string }>();
  const navigate = useNavigate();
  const { login, register, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Normalize role or fallback
  const validRoleKey = portalRole && ROLE_CONFIGS[portalRole.toLowerCase()] ? portalRole.toLowerCase() : 'patient';
  const config = ROLE_CONFIGS[validRoleKey];
  const Icon = config.icon;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // Verify role authorization
        if (loggedInUser.role !== config.role) {
          setError(
            `Account role mismatch: This account belongs to the "${loggedInUser.role}" role, but you are logging into the "${config.name}". Redirecting to your assigned portal...`
          );
          setTimeout(() => {
            const redirectPath = loggedInUser.role === 'receptionist' ? '/reception' : `/${loggedInUser.role}`;
            navigate(redirectPath, { replace: true });
          }, 1500);
          return;
        }
        navigate(config.targetRoute, { replace: true });
      } else {
        // Registration (patients only)
        if (!name.trim() || !email.trim() || !password) {
          setError('Please fill in all required fields.');
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
        setSuccessMsg('Account created successfully! Entering Patient Portal...');
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
      // Use switchRole for fast, reliable demo access directly into the designated role
      const user = await switchRole(config.role);
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
    <div className="min-h-screen flex flex-col bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-[#343347] light:border-[#DDD9E9] bg-[#15151F]/80 light:bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Back to Portal Selection */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#8B5CF6]" />
            <span>Back to Portal Selection</span>
          </Link>

          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-[#F4F2FA] light:text-[#242033] hidden sm:inline">ClinicQueue</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 rounded-xl border border-[#343347] light:border-[#DDD9E9] bg-[#1B1B28] light:bg-[#F0EFF7] text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#6D28D9]" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Role Header Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#29213D] light:bg-[#EDE9FE] border border-[#343347] light:border-[#DDD9E9] text-[#A78BFA] light:text-[#6D28D9] mb-4 shadow-md">
              <Icon className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#8B5CF6]/15 text-[#A78BFA] light:bg-[#EDE9FE] light:text-[#6D28D9] mb-2">
              {config.badge}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F2FA] light:text-[#242033]">
              {mode === 'login' ? `${config.name} Sign In` : 'New Patient Registration'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#AAA6BC] light:text-[#625D74]">
              {config.desc}
            </p>
          </div>

          {/* Mode Switcher for Patients */}
          {config.role === 'patient' && (
            <div className="flex bg-[#1B1B28] light:bg-[#EAE7F1] p-1 rounded-xl mb-6 border border-[#343347] light:border-[#DDD9E9]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033]'
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
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 sm:p-8 shadow-xl">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#AAA6BC] light:text-[#625D74] mb-1.5">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#817C95]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rohan Mehta"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15151F] light:bg-[#F7F7FB] border border-[#343347] light:border-[#DDD9E9] text-[#F4F2FA] light:text-[#242033] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#AAA6BC] light:text-[#625D74] mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#817C95]" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#15151F] light:bg-[#F7F7FB] border border-[#343347] light:border-[#DDD9E9] text-[#F4F2FA] light:text-[#242033] text-xs focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#AAA6BC] light:text-[#625D74] mb-1.5">
                        Age
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#15151F] light:bg-[#F7F7FB] border border-[#343347] light:border-[#DDD9E9] text-[#F4F2FA] light:text-[#242033] text-xs focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-[#AAA6BC] light:text-[#625D74] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#817C95]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={config.demoEmail}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15151F] light:bg-[#F7F7FB] border border-[#343347] light:border-[#DDD9E9] text-[#F4F2FA] light:text-[#242033] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#AAA6BC] light:text-[#625D74]">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={handleFillDemoCreds}
                      className="text-[11px] text-[#8B5CF6] hover:underline"
                    >
                      Fill Demo Credentials
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#817C95]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15151F] light:bg-[#F7F7FB] border border-[#343347] light:border-[#DDD9E9] text-[#F4F2FA] light:text-[#242033] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? `Sign In to ${config.name}` : 'Register & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Button */}
            <div className="mt-6 pt-5 border-t border-[#29293A] light:border-[#EAE7F1]">
              <div className="text-center mb-3">
                <span className="text-[11px] text-[#817C95] light:text-[#777188] uppercase tracking-wider font-semibold">
                  Or Test With Demo Account
                </span>
              </div>

              <button
                type="button"
                onClick={handleInstantDemo}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-[#343347] light:border-[#DDD9E9] bg-[#222233] hover:bg-[#29293E] light:bg-[#F0EFF7] light:hover:bg-[#EAE7F1] text-[#F4F2FA] light:text-[#242033] text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#A78BFA] light:text-[#6D28D9]" />
                <span>Instant 1-Click Access as {config.demoPersona}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthView;