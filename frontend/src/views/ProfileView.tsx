import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Insurance } from '../types';
import {
  User,
  Shield,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  Building,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  X
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    provider_name: '',
    policy_number: '',
    tpa_id: '',
    coverage_limit: '',
    copay_percentage: '',
    valid_until: '',
    status: 'active' as 'active' | 'expired' | 'pending'
  });

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await api.getInsurance();
      if (res.insurance) {
        setInsurance(res.insurance);
        setFormData({
          provider_name: res.insurance.provider_name || 'Star Health & Allied Insurance',
          policy_number: res.insurance.policy_number || 'SHI-POL-2026-9812',
          tpa_id: res.insurance.tpa_id || 'TPA-MD-88190',
          coverage_limit: res.insurance.coverage_limit || '₹5,00,000',
          copay_percentage: res.insurance.copay_percentage || '10%',
          valid_until: res.insurance.valid_until || '2027-03-31',
          status: res.insurance.status || 'active'
        });
      }
    } catch (err) {
      console.error('Failed to fetch insurance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateInsurance(formData);
      if (res.insurance) {
        setInsurance(res.insurance);
      } else {
        setInsurance((prev) => (prev ? { ...prev, ...formData } : null));
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditModalOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(`Failed to update insurance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8f8] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-[#d5dfe3] shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4f4] text-[#0b6e6e] mb-1">
              <User className="w-3.5 h-3.5" />
              <span>Patient Account & Coverage</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1b2b34]">Health Profile & Insurance</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your personal medical identification, emergency contacts, and cashless insurance pre-authorization.
            </p>
          </div>

          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0b6e6e] hover:bg-[#085252] text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Update Insurance Policy</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Demographics Card */}
          <div className="bg-white rounded-2xl border border-[#d5dfe3] p-6 shadow-xs h-fit">
            <div className="flex items-center gap-3 pb-6 border-b border-[#d5dfe3]">
              <div className="w-12 h-12 rounded-full bg-[#e6f4f4] text-[#0b6e6e] flex items-center justify-center font-bold text-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1b2b34]">{user?.name || 'Rohan Mehta'}</h3>
                <p className="text-xs text-slate-500">{user?.email || 'patient@clinicqueue.demo'}</p>
                <div className="mt-1 font-mono text-[11px] font-semibold text-[#0b6e6e] bg-[#e6f4f4] px-2 py-0.5 rounded w-fit">
                  MRN: {user?.patient_profile?.mrn || 'CQ-MRN-00001'}
                </div>
              </div>
            </div>

            <div className="py-6 space-y-4 text-xs border-b border-[#d5dfe3]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gender & Age</span>
                <span className="font-semibold text-[#1b2b34]">Male, 34 yrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Primary Hospital</span>
                <span className="font-semibold text-[#1b2b34]">MetroCare Apex Hospital</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Registered Phone</span>
                <span className="font-semibold text-[#1b2b34]">+91 98201 44510</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Blood Group</span>
                <span className="font-semibold text-[#1b2b34]">B Positive (B+)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Emergency Contact</span>
                <span className="font-semibold text-[#1b2b34]">Pooja Mehta (+91 98201 44519)</span>
              </div>
            </div>

            <div className="pt-6">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Active Outpatient Verification
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Identity verified via Government ABHA / Aadhaar ID</span>
              </div>
            </div>
          </div>

          {/* Insurance Coverage Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cashless Card */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-[#1b2b34] to-[#0b6e6e] text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between pb-6 border-b border-white/10">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold mb-1">
                    Cashless Health Card
                  </div>
                  <h3 className="text-xl font-bold">{insurance?.provider_name || 'Star Health & Allied Insurance'}</h3>
                  <p className="text-xs text-teal-100">Third Party Administrator (TPA): Medi Assist India</p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-400 text-emerald-950">
                  {insurance?.status || 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
                <div>
                  <div className="text-teal-200 text-[11px]">Policy Number</div>
                  <div className="font-mono font-bold text-sm mt-0.5">{insurance?.policy_number || 'SHI-POL-2026-9812'}</div>
                </div>

                <div>
                  <div className="text-teal-200 text-[11px]">TPA Member ID</div>
                  <div className="font-mono font-bold text-sm mt-0.5">{insurance?.tpa_id || 'TPA-MD-88190'}</div>
                </div>

                <div>
                  <div className="text-teal-200 text-[11px]">Coverage Sum</div>
                  <div className="font-bold text-sm mt-0.5">{insurance?.coverage_limit || '₹5,00,000'}</div>
                </div>

                <div>
                  <div className="text-teal-200 text-[11px]">Valid Thru</div>
                  <div className="font-bold text-sm mt-0.5">{insurance?.valid_until || '2027-03-31'}</div>
                </div>
              </div>
            </div>

            {/* Insurance Benefits Grid */}
            <div className="bg-white rounded-2xl border border-[#d5dfe3] p-6 shadow-xs">
              <h3 className="text-base font-bold text-[#1b2b34] mb-4">Coverage & Outpatient Benefits</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#f4f8f8] border border-[#d5dfe3]">
                  <div className="text-slate-500 font-medium">OPD Consultation Copay</div>
                  <div className="text-xl font-extrabold text-[#0b6e6e] mt-1">
                    {insurance?.copay_percentage || '10%'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">90% covered by insurer for empanelled OPD clinics.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#f4f8f8] border border-[#d5dfe3]">
                  <div className="text-slate-500 font-medium">Pre-Authorization</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-1">Instant</div>
                  <p className="text-[11px] text-slate-500 mt-1">Digital QR scan verification at hospital reception.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#f4f8f8] border border-[#d5dfe3]">
                  <div className="text-slate-500 font-medium">Pharmacy / Diagnostics</div>
                  <div className="text-xl font-extrabold text-[#1b2b34] mt-1">₹15,000 / yr</div>
                  <p className="text-[11px] text-slate-500 mt-1">Includes lab tests & prescribed outpatient medicines.</p>
                </div>
              </div>

              {/* Pre-Auth Notice */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-[#d5dfe3] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0b6e6e] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-[#1b2b34]">Cashless OPD Desk at MetroCare Apex:</span> When checking in at
                  the reception, simply present your booking reference or digital MRN card. The receptionist will
                  validate your cashless authorization automatically with zero manual paperwork.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#d5dfe3]">
              <div className="flex items-center justify-between pb-4 border-b border-[#d5dfe3]">
                <h3 className="text-base font-bold text-[#1b2b34]">Update Insurance Policy</h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  Insurance policy updated successfully!
                </div>
              )}

              <form onSubmit={handleUpdate} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Insurance Provider Name</label>
                  <input
                    type="text"
                    value={formData.provider_name}
                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-[#1b2b34]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Policy Number</label>
                    <input
                      type="text"
                      value={formData.policy_number}
                      onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-[#1b2b34]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">TPA Member ID</label>
                    <input
                      type="text"
                      value={formData.tpa_id}
                      onChange={(e) => setFormData({ ...formData, tpa_id: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-[#1b2b34]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Coverage Limit</label>
                    <input
                      type="text"
                      value={formData.coverage_limit}
                      onChange={(e) => setFormData({ ...formData, coverage_limit: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-[#1b2b34]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Co-Pay Rate</label>
                    <input
                      type="text"
                      value={formData.copay_percentage}
                      onChange={(e) => setFormData({ ...formData, copay_percentage: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-[#1b2b34]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-[#1b2b34]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Policy Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-[#1b2b34]"
                    >
                      <option value="active">Active (Cashless Enabled)</option>
                      <option value="pending">Pending Verification</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-[#0b6e6e] hover:bg-[#085252] text-white font-semibold flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
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
