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
          provider_name: res.insurance.provider_name || 'Star Health Comprehensive',
          policy_number: res.insurance.policy_number || 'SHI-POL-2026-9812',
          tpa_id: res.insurance.tpa_id || 'TPA-MD-88190',
          coverage_limit: res.insurance.coverage_limit || '₹ 5,00,000',
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
      setInsurance(res.insurance);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditModalOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#60A5FA] text-[#0B1020] font-black text-xl flex items-center justify-center shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#F1F5F9] light:text-[#0F172A]">{user?.name}</h2>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F172A] light:bg-[#EFF6FF] text-[#60A5FA] border border-[#29344D]">
                {user?.mrn || 'CQ-MRN-9021'}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
              Verified Outpatient Health Profile • {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-[#0F172A] light:bg-[#F1F5F9] border border-[#29344D] light:border-[#E2E8F0] hover:border-[#60A5FA] text-xs font-semibold text-[#F1F5F9] light:text-[#0F172A] flex items-center gap-2 transition-all shadow-xs"
        >
          <Edit2 className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Update Card Details</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient Demographic Card */}
        <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Patient Demographics</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <span className="text-[#94A3B8]">Medical Record No.</span>
              <strong className="font-mono text-[#60A5FA]">{user?.mrn || 'CQ-MRN-9021'}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <span className="text-[#94A3B8]">Registered Email</span>
              <strong className="text-[#F1F5F9] light:text-[#0F172A]">{user?.email}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <span className="text-[#94A3B8]">Contact Phone</span>
              <strong className="text-[#F1F5F9] light:text-[#0F172A]">{user?.phone || '+91 98765 43210'}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <span className="text-[#94A3B8]">Primary Hospital</span>
              <strong className="text-[#F1F5F9] light:text-[#0F172A]">MetroCare Apex Hospital</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Emergency Contact</span>
              <strong className="text-emerald-400">+91 98111 22334 (Spouse)</strong>
            </div>
          </div>
        </div>

        {/* Right: Cashless Insurance Smart Card */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            Outpatient Cashless Insurance Card
          </h3>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1B263D] via-[#151D31] to-[#0F172A] border border-[#29344D] text-[#F1F5F9] shadow-md flex flex-col justify-between h-56 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#93C5FD]">
                  Ayushman / TPA Cashless Network
                </span>
                <h4 className="text-lg font-black tracking-tight mt-0.5">
                  {insurance?.provider_name || 'Star Health Comprehensive'}
                </h4>
              </div>

              <div className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active Coverage</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Policy Number</span>
                <strong className="font-mono text-sm tracking-wider text-[#60A5FA]">
                  {insurance?.policy_number || 'SHI-POL-2026-9812'}
                </strong>
              </div>

              <div>
                <span className="text-[10px] text-[#94A3B8] block">TPA Member ID</span>
                <strong className="font-mono text-xs">{insurance?.tpa_id || 'TPA-MD-88190'}</strong>
              </div>

              <div>
                <span className="text-[10px] text-[#94A3B8] block">OPD Copay</span>
                <strong className="text-xs text-amber-400">{insurance?.copay_percentage || '10%'}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#29344D] text-[11px] text-[#94A3B8]">
              <span>Coverage Limit: {insurance?.coverage_limit || '₹ 5,00,000'}</span>
              <span>Valid Thru: {insurance?.valid_until || '2027-03-31'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Insurance Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <h3 className="font-bold text-base text-[#F1F5F9] light:text-[#0F172A]">Update Health Insurance Card</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccess && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-950/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Card details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  required
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.policy_number}
                    onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">TPA Member ID</label>
                  <input
                    type="text"
                    value={formData.tpa_id}
                    onChange={(e) => setFormData({ ...formData, tpa_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                    Coverage Limit
                  </label>
                  <input
                    type="text"
                    value={formData.coverage_limit}
                    onChange={(e) => setFormData({ ...formData, coverage_limit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Copay (%)</label>
                  <input
                    type="text"
                    value={formData.copay_percentage}
                    onChange={(e) => setFormData({ ...formData, copay_percentage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-2 py-2.5 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] text-[#0B1020] light:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Card Verification</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;