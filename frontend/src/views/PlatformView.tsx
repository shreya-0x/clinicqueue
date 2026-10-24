import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Organization } from '../types';
import {
  Compass,
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Database,
  Activity,
  X,
  Search,
  ExternalLink
} from 'lucide-react';

export const PlatformView: React.FC = () => {
  const { storageInfo } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New hospital form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [hospType, setHospType] = useState('Super Specialty');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await api.getOrganizations();
      setOrganizations(res.organizations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleToggleStatus = async (orgId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateOrgStatus(orgId, nextStatus);
      await fetchOrgs();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !city) return;
    setActionLoading(true);
    try {
      await api.createOrganization({
        name,
        code: code.toUpperCase(),
        city,
        type: hospType,
        status: 'active'
      });
      setShowAddModal(false);
      setName('');
      setCode('');
      setCity('');
      await fetchOrgs();
    } catch (err: any) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-6 border border-[#343347] light:border-[#DDD9E9] shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>National Healthcare Network Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              ClinicQueue Platform Administration
            </h1>
            <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-0.5">
              Federated network directory, hospital onboarding, and system infrastructure observability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Hospital</span>
            </button>
          </div>
        </div>

        {/* System Health / Storage Monitor Card */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-6 border border-[#343347] light:border-[#DDD9E9] shadow-xs mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1] mb-4">
            <h2 className="text-sm font-bold text-[#F4F2FA] light:text-[#242033] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#8B5CF6]" />
              <span>Platform Infrastructure & Storage Engine Status</span>
            </h2>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px]">Database Architecture</div>
              <div className="text-sm font-bold text-navy-900 mt-1">
                {storageInfo?.is_atlas ? 'MongoDB Atlas Cluster (Remote Cloud)' : 'Embedded JSON Datastore (High-Fidelity Offline)'}
              </div>
              <p className="text-slate-500 mt-1">
                {storageInfo?.description || 'Production MongoDB-compatible document store.'}
              </p>
            </div>

            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px]">Active Multi-Tenancy Scope</div>
              <div className="text-sm font-bold text-navy-900 mt-1">{organizations.length} Onboarded Facilities</div>
              <p className="text-slate-500 mt-1">
                Server-enforced organization isolation across New Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad.
              </p>
            </div>

            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px]">Timezone & Punctuality Config</div>
              <div className="text-sm font-bold text-navy-900 mt-1">Asia/Kolkata (IST • UTC+05:30)</div>
              <p className="text-slate-500 mt-1">
                Synchronized with hospital outpatient clinic schedules and morning/afternoon shift windows.
              </p>
            </div>
          </div>
        </div>

        {/* Federated Hospital Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900">National Hospital Directory</h2>
              <p className="text-xs text-slate-500">Manage participating healthcare organizations across India.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
              {organizations.length} Hospitals
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Hospital Name & Code</th>
                  <th className="py-3 px-4">City / Region</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900 flex items-center gap-1.5">
                        <span>{org.name}</span>
                        {org.is_flagship && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Flagship
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">Code: {org.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-navy-900">{org.city}</div>
                      <div className="text-[11px] text-slate-500">{org.state}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{org.type}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          org.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(org._id, org.status)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          org.status === 'active'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {org.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Onboarding Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-navy-900">Onboard Hospital Organization</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateHospital} className="mt-4 space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hospital Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Max Super Specialty Hospital"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-navy-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Code</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. MSSH"
                      className="w-full rounded-xl border border-slate-300 p-2.5 uppercase font-mono text-navy-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lucknow"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-navy-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Facility Type</label>
                  <select
                    value={hospType}
                    onChange={(e) => setHospType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-navy-900"
                  >
                    <option value="Super Specialty">Super Specialty</option>
                    <option value="Multispecialty Tertiary">Multispecialty Tertiary</option>
                    <option value="Community Hospital">Community Hospital</option>
                    <option value="Ambulatory & Outpatient">Ambulatory & Outpatient</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                  >
                    {actionLoading ? 'Provisioning...' : 'Provision Organization'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
