import React, { useState, useEffect } from 'react';
import { AddressData } from '../../../services/customer-operations.service';

interface AddressFormProps {
  initialData?: any;
  onSubmit: (data: AddressData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const SERVICE_AREAS = [
  { id: 'law_gate', name: 'Law Gate' },
  { id: 't_point', name: 'T Point' },
  { id: 'green_valley', name: 'Green Valley' },
  { id: 'bhutani_colony', name: 'Bhutani Colony' },
  { id: 'riya_girls_hostel', name: 'Riya Girls Hostel' },
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
        <label className="text-xs font-bold text-gray-500 uppercase">Exact Location</label>
        <input
          type="text"
          placeholder="House No, Apartment name, Landmark etc."
          required
          value={formData.addressLine}
          onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
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
                setFormData({
                  ...formData,
                  area: area.name
                });
              }}
              className={`p-3 rounded border text-left transition-all ${
                formData.area === area.name
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <p className="font-bold text-xs">{area.name}</p>
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
