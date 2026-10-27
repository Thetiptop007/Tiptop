import React, { useState, useEffect } from 'react';
import { AddressData } from '../../../services/customer-operations.service';

interface AddressFormProps {
  initialData?: any;
  onSubmit: (data: AddressData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const SERVICE_AREAS = [
  { id: 'law_gate', name: 'Law Gate', subtitle: 'Prime Delivery Zone' },
  { id: 't_point', name: 'T Point', subtitle: 'Speedy Express' },
  { id: 'green_valley', name: 'Green Valley', subtitle: 'Residential Sector' },
  { id: 'bhutani_colony', name: 'Bhutani Colony', subtitle: 'South Wing' },
  { id: 'riya_girls_hostel', name: 'Riya Girls Hostel', subtitle: 'Campus Hub' },
];

const ADDRESS_TYPES = [
  {
    type: 'home' as const,
    label: 'Home',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    type: 'work' as const,
    label: 'Work',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: 'other' as const,
    label: 'Other',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSaving
}) => {
  const [formData, setFormData] = useState<AddressData>({
    type: 'home',
    label: '',
    area: '',
    addressLine: '',
    landmark: '',
    isDefault: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.area) {
      alert('Please select a delivery area');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-neutral-900 tracking-tight">
            {initialData ? 'Update Address' : 'Add New Address'}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Save delivery coordinates for speedy kitchen dispatch.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Close form"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Type Selection */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">
          Address Tag
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ADDRESS_TYPES.map(({ type, label, icon }) => {
            const isSelected = formData.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                    : 'bg-neutral-50/60 hover:bg-neutral-100/80 text-neutral-700 border-neutral-200/80'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Select Area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
            Delivery Area <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-neutral-400 font-medium">Select your campus / zone</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SERVICE_AREAS.map((area) => {
            const isSelected = formData.area === area.name;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    area: area.name
                  });
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm ring-1 ring-neutral-950'
                    : 'border-neutral-200/90 bg-white hover:border-neutral-300 hover:bg-neutral-50/50 text-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-xs">{area.name}</p>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </div>
                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  {area.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exact Location */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">
          Full Address & Specifics <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="House No, Apartment name, Landmark etc."
            required
            value={formData.addressLine}
            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border border-neutral-200/90 bg-neutral-50/50 text-neutral-900 text-sm placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition-all font-medium"
          />
        </div>
      </div>

      {/* Optional Custom Label or Landmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
            Custom Label <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. My Flat, Mom's House"
            value={formData.label || ''}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200/90 bg-neutral-50/50 text-neutral-900 text-xs placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
            Nearby Landmark <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Opposite Main Gate"
            value={formData.landmark || ''}
            onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200/90 bg-neutral-50/50 text-neutral-900 text-xs placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
          />
        </div>
      </div>

      {/* Default Checkbox Toggle */}
      <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200/70 bg-neutral-50/40 hover:bg-neutral-50 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={formData.isDefault ?? false}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-black cursor-pointer accent-black"
        />
        <div className="select-none">
          <p className="text-xs font-bold text-neutral-900">Set as default delivery address</p>
          <p className="text-[11px] text-neutral-500">Auto-selected during quick checkout</p>
        </div>
      </label>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-full border border-neutral-200/90 text-neutral-700 font-bold text-xs hover:bg-neutral-100 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 py-3 px-4 rounded-full bg-neutral-950 text-white font-extrabold text-xs hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {isSaving && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{isSaving ? 'Saving...' : 'Save Address'}</span>
        </button>
      </div>
    </form>
  );
};

