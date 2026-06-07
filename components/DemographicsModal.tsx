'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const AGE_RANGES = [
  'Under 18', '18-24', '25-34', '35-44', '45-54', '55+'
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

interface DemographicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (demographics: { age?: string; gender?: string; country?: string } | null) => void;
  detectedCountry?: string | null;
}

export default function DemographicsModal({ isOpen, onClose, onComplete, detectedCountry }: DemographicsModalProps) {
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState(detectedCountry || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const demographics: { age?: string; gender?: string; country?: string } = {};
    if (ageRange) demographics.age = ageRange;
    if (gender && gender !== 'Prefer not to say') demographics.gender = gender;
    if (country) demographics.country = country;
    onComplete(demographics);
    setLoading(false);
    onClose();
  };

  const handleSkip = () => {
    onComplete(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary px-5 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Help us improve</h3>
          <button onClick={handleSkip} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">
            Your responses are anonymous and help poll creators understand their audience better.
            You can skip this – it's totally optional.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Age range</label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select your age range</option>
                {AGE_RANGES.map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select your gender</option>
                {GENDERS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Your country"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {detectedCountry && (
                <p className="text-xs text-gray-400 mt-1">We detected: {detectedCountry}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2 text-sm font-semibold shadow hover:shadow-md transition"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}