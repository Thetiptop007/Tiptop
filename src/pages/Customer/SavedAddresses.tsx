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

  if (authLoading) {
    return (
      <div className="py-24 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Loading addresses...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const getTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'work':
        return {
          icon: '💼',
          label: 'Work',
          bg: 'bg-amber-50 text-amber-900 border-amber-200/60',
        };
      case 'other':
        return {
          icon: '📍',
          label: 'Other',
          bg: 'bg-neutral-100 text-neutral-800 border-neutral-200/80',
        };
      case 'home':
      default:
        return {
          icon: '🏠',
          label: 'Home',
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200/60',
        };
    }
  };

  return (
    <div className="w-full pb-20 font-sans text-neutral-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Clean Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/customer/profile')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors group mb-1.5"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Profile</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
              Saved Addresses
            </h1>
          </div>

          <button
            onClick={() => form.open()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-burgundy text-white text-xs font-semibold hover:bg-burgundy-600 active:scale-95 transition-all shadow-xs shrink-0"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>Add New</span>
          </button>
        </div>

        {/* Modal / Inline Form Accordion */}
        {form.isOpen && (
          <div className="mb-6 bg-white border border-neutral-200/90 p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-sm">
            <AddressForm
              initialData={form.editing}
              onSubmit={actions.save}
              onCancel={form.close}
              isSaving={false}
            />
          </div>
        )}

        {/* Addresses Query Container */}
        <QueryBoundary
          query={query}
          emptyComponent={
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-8 sm:p-12 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-2xl">
                📍
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-950 mb-1">
                No saved addresses yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-5 leading-relaxed">
                Add your home, hostel, or workplace to unlock 1-click delivery checkout.
              </p>
              <button
                onClick={() => form.open()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-burgundy text-white text-xs font-semibold hover:bg-burgundy-600 active:scale-95 transition-all shadow-sm"
              >
                <span>+</span>
                <span>Add Your First Address</span>
              </button>
            </div>
          }
        >
          {(addresses) => (
            <div className="space-y-3">
              {addresses.map((address) => {
                const badge = getTypeBadge(address.type);
                const isDefault = !!address.isDefault;

                return (
                  <div
                    key={address._id}
                    className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border transition-all ${
                      isDefault
                        ? 'border-neutral-900/30 shadow-xs'
                        : 'border-neutral-200/80 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Type Icon */}
                        <div className="w-10 h-10 rounded-xl sm:rounded-2xl bg-neutral-100 flex items-center justify-center text-lg shrink-0">
                          {badge.icon}
                        </div>

                        {/* Details */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-extrabold text-neutral-950 tracking-tight">
                              {address.label || badge.label}
                            </span>

                            {isDefault ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Default
                              </span>
                            ) : (
                              <button
                                onClick={() => address._id && actions.setDefault(address._id)}
                                className="text-[11px] text-neutral-400 hover:text-black font-semibold hover:underline transition-colors"
                              >
                                Set as default
                              </button>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm font-medium text-neutral-800 leading-snug break-words">
                            {address.addressLine}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500 pt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <span className="font-semibold text-neutral-700">Area:</span> {address.area}
                            </span>
                            {address.landmark && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-semibold text-neutral-700">Landmark:</span> {address.landmark}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Actions */}
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => form.open(address)}
                          className="px-3 py-1.5 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-black hover:border-black transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => address._id && actions.delete(address._id)}
                          className="px-3 py-1.5 rounded-full border border-neutral-200 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50/50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Mobile Actions Bar */}
                    <div className="flex sm:hidden items-center justify-end gap-2 pt-3 mt-3 border-t border-neutral-100">
                      <button
                        onClick={() => form.open(address)}
                        className="flex-1 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 text-center hover:bg-neutral-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => address._id && actions.delete(address._id)}
                        className="flex-1 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-rose-600 text-center hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
};

export default SavedAddresses;



