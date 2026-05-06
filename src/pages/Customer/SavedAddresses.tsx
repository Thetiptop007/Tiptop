import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { getAddresses, setDefaultAddress, deleteAddress, createAddress, updateAddress, AddressData } from '../../services/customer-operations.service';
import { isCustomerAuthBootReady, waitForCustomerAuthBootReady } from '../../services/customer-auth.service';

export interface Address {
  _id?: string;
  type: 'home' | 'work' | 'other';
  label?: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
  isDefault: boolean;
  createdAt?: string;
}

// Service areas configuration - matches mobile app
const SERVICE_AREAS = [
  { id: 'law_gate', name: 'Law Gate', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 't_point', name: 'T Point', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'green_valley', name: 'Green Valley', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'bhutani_colony', name: 'Bhutani Colony', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
  { id: 'riya_girls_hostel', name: 'Riya Girls Hostel', city: 'Phagwara', state: 'Punjab', zipCode: '144401' },
];

const SavedAddresses: React.FC = () => {
  const navigate = useNavigate();
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [newAddress, setNewAddress] = useState<Address>({
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/customer/login', { state: { from: '/customer/addresses' } });
      return;
    }
  }, [authLoading, isAuthenticated, navigate, customer]);

  useEffect(() => {
    if (isAuthenticated) {
      const initializeFetch = async () => {
        // Wait for auth bootstrap to complete before fetching protected data
        if (!isCustomerAuthBootReady()) {
          await waitForCustomerAuthBootReady();
        }
        fetchAddresses();
      };
      
      void initializeFetch();
    }
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAddresses();
      if (response.status === 'success') {
        setAddresses(response.data.addresses);
      } else if (response.message?.includes('Invalid token') || response.message?.includes('log in')) {
        navigate('/customer/login', { state: { from: '/customer/addresses' } });
      } else {
        setError(response.message || 'Unexpected response from server');
      }
    } catch (err: any) {
      // Check if it's an auth error
      if (err.message?.includes('Invalid token') || err.message?.includes('log in')) {
        navigate('/customer/login', { state: { from: '/customer/addresses' } });
      } else {
        setError(err.message || 'Failed to fetch addresses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to set default address');
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await deleteAddress(addressId);
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete address');
    }
  };

  const handleSaveAddress = async () => {
    if (!selectedArea) {
      setError('Please select a delivery area');
      return;
    }
    
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      // Get the selected area details
      const selectedAreaDetails = SERVICE_AREAS.find(area => area.id === selectedArea);
      
      // Prepend area name to street address (like mobile app)
      const addressData = {
        ...newAddress,
        street: selectedAreaDetails 
          ? `${selectedAreaDetails.name}, ${newAddress.street}` 
          : newAddress.street
      };
      
      if (editingAddress && editingAddress._id) {
        await updateAddress(editingAddress._id, addressData);
      } else {
        await createAddress(addressData);
      }
      await fetchAddresses();
      setShowAddressForm(false);
      setEditingAddress(null);
      setSelectedArea('');
      setNewAddress({
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
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    
    // Try to extract area name from street address
    let areaId = '';
    let cleanStreet = address.street;
    
    // Check if street starts with any of the area names
    for (const area of SERVICE_AREAS) {
      if (address.street.startsWith(`${area.name}, `)) {
        areaId = area.id;
        // Remove area name from street to show only the actual address
        cleanStreet = address.street.replace(`${area.name}, `, '');
        break;
      }
    }
    
    // Fallback: try to find matching area from city field
    if (!areaId) {
      const matchingArea = SERVICE_AREAS.find(
        area => area.city === address.city || area.name === address.city
      );
      areaId = matchingArea?.id || '';
    }
    
    setSelectedArea(areaId);
    setNewAddress({
      ...address,
      street: cleanStreet, // Use clean street without area name
    });
    setShowAddressForm(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        );
      case 'work':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        );
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        );
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/customer/profile')}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Saved Addresses</h1>
          <button
            onClick={() => setShowAddressForm(true)}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Add/Edit Address Form */}
        {showAddressForm && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <div className="space-y-4">
              {/* Address Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address Type
                </label>
                <div className="flex gap-2">
                  {(['home', 'work', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewAddress({ ...newAddress, type })}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        newAddress.type === type
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress.label || ''}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., My Home"
                  maxLength={50}
                />
              </div>

              {/* Apartment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flat / Apartment (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress.apartment || ''}
                  onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Flat 101, Building A"
                  maxLength={100}
                />
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 123 Main Street"
                  maxLength={200}
                  required
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={newAddress.landmark || ''}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Near City Mall"
                  maxLength={100}
                />
              </div>

              {/* Delivery Area Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Area <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_AREAS.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        setSelectedArea(area.id);
                        setNewAddress({
                          ...newAddress,
                          city: area.city,
                          state: area.state,
                          zipCode: area.zipCode,
                        });
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        selectedArea === area.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        selectedArea === area.id
                          ? 'bg-indigo-600 dark:bg-indigo-500'
                          : 'bg-gray-100 dark:bg-gray-600'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          selectedArea === area.id
                            ? 'text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-semibold text-sm ${
                          selectedArea === area.id
                            ? 'text-indigo-900 dark:text-indigo-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {area.name}
                        </p>
                        <p className={`text-xs ${
                          selectedArea === area.id
                            ? 'text-indigo-600 dark:text-indigo-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {area.zipCode}
                        </p>
                      </div>
                      {selectedArea === area.id && (
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {!selectedArea && error && error.includes('delivery area') && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>

              {/* Delivery Area Note */}
              <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Delivery Areas</p>
                  <p className="text-xs">
                    We currently deliver to Law Gate, T Point, Green Valley, Bhutani Colony, and Riya Girls Hostel areas only.{' '}
                    <span className="font-semibold">Soon expanding to other areas!</span>
                  </p>
                </div>
              </div>

              {/* Auto-filled fields (read-only display) */}
              {selectedArea && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Auto-filled Details:</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">City</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{newAddress.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">State</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{newAddress.state}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ZIP Code</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{newAddress.zipCode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddress(null);
                    setNewAddress({
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
                    setError('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddress}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading addresses...</p>
          </div>
        ) : addresses.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Addresses</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 max-w-sm">
              Add your delivery addresses to make checkout faster
            </p>
            <button
              onClick={() => setShowAddressForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add Address
            </button>
          </div>
        ) : (
          /* Address List */
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address._id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Type Icon */}
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {getTypeIcon(address.type)}
                      </svg>
                    </div>
                    {/* Type & Label */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white capitalize">
                        {address.label || address.type}
                      </h3>
                      {address.isDefault && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => address._id && handleSetDefault(address._id)}
                        className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                        title="Set as default"
                      >
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleEditAddress(address)}
                      className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      title="Edit address"
                    >
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => address._id && handleDelete(address._id)}
                      className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete address"
                    >
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Address Content */}
                <div className="space-y-1">
                  {address.apartment && (
                    <p className="text-sm text-gray-900 dark:text-white">{address.apartment}</p>
                  )}
                  <p className="text-sm text-gray-900 dark:text-white">{address.street}</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                  {address.landmark && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Near: {address.landmark}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedAddresses;
