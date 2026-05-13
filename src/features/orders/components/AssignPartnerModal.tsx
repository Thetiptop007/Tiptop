import React from 'react';

interface AssignPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrderIds: string[];
  partners: any[];
  isAssigning: boolean;
  onAssign: (partnerId: string) => void;
}

export const AssignPartnerModal: React.FC<AssignPartnerModalProps> = ({
  isOpen,
  onClose,
  selectedOrderIds,
  partners,
  isAssigning,
  onAssign
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Delivery Partner</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm text-gray-500">
            Assigning <span className="font-bold text-gray-900 dark:text-white">{selectedOrderIds.length}</span> order(s)
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {partners.length === 0 ? (
              <div className="py-8 text-center text-gray-400 italic">No available partners found</div>
            ) : (
              partners.map(partner => (
                <button
                  key={partner._id}
                  onClick={() => onAssign(partner._id)}
                  disabled={isAssigning}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-left dark:border-gray-700 dark:hover:bg-indigo-900/10"
                >
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{partner.name}</div>
                    <div className="text-xs text-gray-500">{partner.phone}</div>
                  </div>
                  {isAssigning ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 5l7 7-7 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
