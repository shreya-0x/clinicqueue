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

  const handleBookHospital = async (orgId: string) => {
    await switchRole('patient');
    navigate('/patient');
  };

  return (
    <div className="min-h-screen bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] py-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] border border-[#343347] light:border-[#DDD9E9] mb-3">
            <Hospital className="w-3.5 h-3.5" />
            <span>Participating Outpatient Clinics</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Find Outpatient Clinics & Hospitals
          </h1>
          <p className="text-xs sm:text-sm text-[#AAA6BC] light:text-[#625D74] mt-2">
            Explore outpatient specialty clinics equipped with ClinicQueue adaptive waiting-time prediction and digital check-in.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9] shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* City Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCity === city
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'bg-[#222233] light:bg-[#F0EFF7] hover:bg-[#29213D] text-[#AAA6BC] light:text-[#625D74]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#817C95] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facility name or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-[#343347] light:border-[#DDD9E9] bg-[#222233] light:bg-[#F0EFF7] pl-9 pr-3 py-2 text-[#F4F2FA] light:text-[#242033]"
            />
          </div>
        </div>

        {/* Hospitals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((org) => (
            <div
              key={org._id}
              className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs flex flex-col justify-between hover:border-[#8B5CF6] transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#29213D] light:bg-[#EDE9FE] flex items-center justify-center text-[#A78BFA] light:text-[#6D28D9] mb-3">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#222233] light:bg-[#F0EFF7] text-[#A78BFA] light:text-[#6D28D9]">
                    {org.type.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#F4F2FA] light:text-[#242033]">{org.name}</h3>
                <p className="text-xs text-[#AAA6BC] light:text-[#625D74] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>{org.city}, {org.state}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-[#29293A] light:border-[#EAE7F1] text-xs space-y-1.5 text-[#AAA6BC] light:text-[#625D74]">
                  <div>Active Departments: <strong className="text-[#F4F2FA] light:text-[#242033]">{org.departments?.length || 4} Specialties</strong></div>
                  <div>Outpatient Capacity: <strong className="text-[#F4F2FA] light:text-[#242033]">{org.opd_capacity_per_day} patients / day</strong></div>
                  <div>Emergency Contact: <strong className="text-[#F4F2FA] light:text-[#242033]">{org.emergency_contact}</strong></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#29293A] light:border-[#EAE7F1]">
                <button
                  onClick={() => handleBookHospital(org._id)}
                  className="w-full py-2.5 rounded-xl bg-[#29213D] hover:bg-[#8B5CF6] light:bg-[#EDE9FE] light:hover:bg-[#6D28D9] text-[#A78BFA] hover:text-white light:text-[#6D28D9] light:hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Book Consultation at Facility</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
