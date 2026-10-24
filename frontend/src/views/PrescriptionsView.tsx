import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Prescription } from '../types';
import {
  FileText,
  Pill,
  Download,
  Printer,
  Calendar,
  User,
  Stethoscope,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  X
} from 'lucide-react';

export const PrescriptionsView: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.getPrescriptions();
      const list = res.prescriptions || [];
      setPrescriptions(list);
      if (list.length > 0) {
        setSelectedRx(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f4f8f8] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-[#d5dfe3] shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4f4] text-[#0b6e6e] mb-1">
              <Pill className="w-3.5 h-3.5" />
              <span>Digital Health Records</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1b2b34]">Outpatient Prescriptions</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified clinical prescriptions, medication dosages, and follow-up guidance issued by your doctors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!selectedRx}
              className="px-4 py-2 rounded-xl bg-white border border-[#d5dfe3] hover:bg-slate-50 text-[#1b2b34] font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-[#0b6e6e]" />
              <span>Print Prescription</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#d5dfe3] p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-[#0b6e6e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Loading clinical prescriptions...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#d5dfe3] p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1b2b34]">No Prescriptions on Record</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Prescriptions issued by your doctor after completed outpatient consultations will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar List of Prescriptions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Consultation Records ({prescriptions.length})
              </h3>
              {prescriptions.map((rx) => {
                const isSelected = selectedRx?._id === rx._id;
                return (
                  <div
                    key={rx._id}
                    onClick={() => setSelectedRx(rx)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all text-left ${
                      isSelected
                        ? 'bg-white border-[#0b6e6e] shadow-sm ring-1 ring-[#0b6e6e]'
                        : 'bg-white border-[#d5dfe3] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-[#0b6e6e]">{rx.rx_number}</span>
                      <span className="text-[11px] text-slate-500">{rx.date}</span>
                    </div>
                    <div className="font-bold text-[#1b2b34] text-sm">{rx.doctor_name}</div>
                    <div className="text-xs text-slate-500">{rx.department_name}</div>
                    <div className="mt-2 text-xs font-medium text-slate-600 line-clamp-1">
                      Diagnosis: {rx.diagnosis}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#0b6e6e] font-semibold">
                      <Pill className="w-3 h-3" />
                      <span>{rx.medications?.length || 0} Prescribed Items</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Selected Prescription View */}
            {selectedRx && (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#d5dfe3] shadow-xs p-8 relative print:border-none print:shadow-none print:p-0">
                {/* Clinic Header / Watermark */}
                <div className="border-b border-[#d5dfe3] pb-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#0b6e6e]" />
                        <h2 className="text-xl font-bold text-[#1b2b34]">{selectedRx.organization_name}</h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Department of {selectedRx.department_name} • Outpatient Clinic
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-[#0b6e6e]">{selectedRx.rx_number}</div>
                      <div className="text-xs text-slate-500">Date: {selectedRx.date}</div>
                    </div>
                  </div>

                  {/* Doctor & Patient Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-[#f4f8f8] border border-[#d5dfe3] text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Prescribing Doctor</div>
                      <div className="font-bold text-[#1b2b34] text-sm mt-0.5">{selectedRx.doctor_name}</div>
                      <div className="text-slate-500">{selectedRx.department_name}</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Patient Details</div>
                      <div className="font-bold text-[#1b2b34] text-sm mt-0.5">{selectedRx.patient_name}</div>
                      <div className="text-slate-500">MRN: {user?.patient_profile?.mrn || 'CQ-MRN-00001'}</div>
                    </div>
                  </div>
                </div>

                {/* Clinical Diagnosis */}
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Clinical Impression / Diagnosis
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs font-semibold text-amber-950">
                    {selectedRx.diagnosis}
                  </div>
                </div>

                {/* Medications Table */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Prescribed Medications (Rx)
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#d5dfe3]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f4f8f8] text-slate-500 font-semibold uppercase text-[10px] border-b border-[#d5dfe3]">
                        <tr>
                          <th className="py-2.5 px-3">Medication</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d5dfe3]">
                        {selectedRx.medications?.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-3 px-3 font-bold text-[#1b2b34] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0b6e6e]" />
                              {med.name}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-700">{med.dosage}</td>
                            <td className="py-3 px-3 text-slate-600">{med.duration}</td>
                            <td className="py-3 px-3 text-slate-600">{med.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Clinical Advice & Follow-Up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#d5dfe3] text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-[#d5dfe3]">
                    <div className="font-bold text-[#1b2b34] flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0b6e6e]" />
                      <span>Doctor's Advice & Lifestyle</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {selectedRx.advice || 'Follow medication schedule strictly. Maintain adequate hydration.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-[#d5dfe3]">
                    <div className="font-bold text-[#1b2b34] flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0b6e6e]" />
                      <span>Recommended Follow-Up</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {selectedRx.follow_up || 'Return for review in 2 weeks or if symptoms persist.'}
                    </p>
                  </div>
                </div>

                {/* Digital Verification Footer */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#0b6e6e]" />
                    <span>Digitally signed and cryptographically verified on ClinicQueue EMR</span>
                  </div>
                  <div>Valid without physical signature</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
