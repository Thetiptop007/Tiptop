import React, { useState, useEffect } from 'react';
import { AddressData } from '../../../services/customer-operations.service';

interface AddressFormProps {
  initialData?: any;
  onSubmit: (data: AddressData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const SERVICE_AREAS = [
  { id: 'law_gate', name: 'Law Gate', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 't_point', name: 'T Point', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'green_valley', name: 'Green Valley', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'bhutani_colony', name: 'Bhutani Colony', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'riya_girls_hostel', name: 'Riya Girls Hostel', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
];

export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSaving
}) => {
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [formData, setFormData] = useState<AddressData>({
    type: 'home',
    label: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
    isDefault: false,
  });

  useEffect(() => {
    if (initialData) {
      let areaId = '';
      let cleanStreet = initialData.street;
      
      for (const area of SERVICE_AREAS) {
        if (initialData.street.startsWith(`${area.name}, `)) {
          areaId = area.id;
          cleanStreet = initialData.street.replace(`${area.name}, `, '');
          break;
        }
      }
      
      setSelectedArea(areaId);
      setFormData({
        ...initialData,
        street: cleanStreet
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea) {
      alert('Please select a delivery area');
      return;
    }

    const selectedAreaDetails = SERVICE_AREAS.find(area => area.id === selectedArea);
    const submissionData = {
      ...formData,
      street: selectedAreaDetails 
        ? `${selectedAreaDetails.name}, ${formData.street}` 
        : formData.street
    };

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-bold mb-4">
        {initialData ? 'Edit Address' : 'Add New Address'}
      </h2>
      
      {/* Type Selection */}
      <div className="flex gap-2">
        {(['home', 'work', 'other'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFormData({ ...formData, type })}
            className={`flex-1 py-2 rounded border text-sm font-bold ${
              formData.type === type
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase">Street Address</label>
        <input
          type="text"
          placeholder="House No, Apartment name, etc."
          required
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded focus:border-red-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase">Select Area</label>
        <div className="grid grid-cols-2 gap-2">
          {SERVICE_AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => {
                setSelectedArea(area.id);
                setFormData({
                  ...formData,
                  city: area.city,
                  state: area.state,
                  zipCode: area.zipCode
                });
              }}
              className={`p-3 rounded border text-left transition-all ${
                selectedArea === area.id
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <p className="font-bold text-xs">{area.name}</p>
              <p className="text-[10px] text-gray-500">{area.zipCode}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 rounded font-bold text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 py-3 bg-red-600 text-white rounded font-bold text-sm hover:bg-red-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};
