import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Organization } from '../types';
import { Hospital, MapPin, Phone, Building2, ChevronRight, Search, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const HospitalsView: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  useEffect(() => {
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
    fetchOrgs();
  }, []);

  const cities = ['All', 'New Delhi', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

  const filtered = organizations.filter((o) => {
    const matchCity = selectedCity === 'All' || o.city === selectedCity;
    const matchSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.city.toLowerCase().includes(search.toLowerCase()) ||
      o.type.toLowerCase().includes(search.toLowerCase());
    return matchCity && matchSearch;
  });

  const handleBookHospital = async () => {
    await switchRole('patient');
    navigate('/patient/book');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F172A] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB] mb-1">
          <Hospital className="w-3.5 h-3.5" />
          <span>Outpatient Clinics Network</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#F1F5F9] light:text-[#0F172A]">
          Participating Healthcare Facilities
        </h2>
        <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
          Explore clinics and hospitals utilizing ClinicQueue adaptive waiting-time prediction and coordinated queues.
        </p>

        {/* City Filter Pills & Search */}
        <div className="mt-5 pt-4 border-t border-[#1E293B] light:border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCity === city
                    ? 'bg-[#60A5FA] text-[#0B1020]'
                    : 'bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#29344D] light:border-[#E2E8F0]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search facility name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
            />
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((org) => (
          <div
            key={org._id}
            className="p-5 rounded-xl bg-[#151D31] light:bg-white border border-[#29344D] light:border-[#E2E8F0] shadow-sm flex flex-col justify-between hover:border-[#60A5FA] transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F172A] text-[#93C5FD] border border-[#29344D]">
                  {org.code || 'MCAH'}
                </span>
                {org.is_flagship && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                    Flagship Center
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">{org.name}</h3>
              <p className="text-xs text-[#60A5FA] font-medium">{org.type}</p>

              <div className="mt-3 space-y-1 text-xs text-[#94A3B8]">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                  <span>{org.address}, {org.city}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                  <span>{org.phone}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleBookHospital}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-[#0F172A] hover:bg-[#60A5FA] hover:text-[#0B1020] text-[#60A5FA] font-semibold text-xs border border-[#29344D] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Book Appointment at Facility</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HospitalsView;