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
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-3">
            <Hospital className="w-3.5 h-3.5" />
            <span>Participating Healthcare Network</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            Find Outpatient Clinics & Hospitals
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Explore 8 simulated tertiary care and super specialty healthcare centers across India equipped with ClinicQueue adaptive waiting-time prediction.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* City Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCity === city
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facility name or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-navy-900"
            />
          </div>
        </div>

        {/* Hospitals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((org) => (
            <div
              key={org._id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                    <Hospital className="w-5 h-5" />
                  </div>
                  {org.is_flagship && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Flagship Center
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-navy-900">{org.name}</h3>
                <div className="text-xs text-brand-700 font-medium mt-0.5">{org.type}</div>

                <div className="space-y-1.5 mt-4 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{org.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{org.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Adaptive Engine Live
                </span>

                <button
                  onClick={() => handleBookHospital(org._id)}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                >
                  <span>Book Visit</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
