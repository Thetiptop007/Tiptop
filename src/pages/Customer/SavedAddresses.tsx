import React from 'react';
import { useNavigate } from 'react-router';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useAddressOrchestrator } from '../../hooks/useCustomerOrchestrators';
import { QueryBoundary } from '../../components/common/QueryBoundary';
import { AddressForm } from '../../features/customer/components/AddressForm';

const SavedAddresses: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const { query, form, actions } = useAddressOrchestrator();

  if (authLoading) return <div className="p-20 text-center">Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/customer/profile')}
            className="text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Saved Addresses</h1>
          <button
            onClick={() => form.open()}
            className="text-red-600 font-bold text-sm"
          >
            Add New
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        {form.isOpen && (
          <div className="mb-6 bg-white border border-gray-200 p-6 rounded">
            <AddressForm
              initialData={form.editing}
              onSubmit={actions.save}
              onCancel={form.close}
              isSaving={false}
            />
          </div>
        )}

        <QueryBoundary query={query}>
          {(addresses) => (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className="bg-white border border-gray-200 p-4 rounded"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm capitalize">
                        {address.label || address.type}
                        {address.isDefault && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Default</span>}
                      </h3>
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {address.apartment && <p>{address.apartment}</p>}
                        <p>{address.street}</p>
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => form.open(address)}
                        className="text-xs font-bold text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => address._id && actions.delete(address._id)}
                        className="text-xs font-bold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
};

export default SavedAddresses;
