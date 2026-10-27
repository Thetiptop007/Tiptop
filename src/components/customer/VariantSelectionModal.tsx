import React from 'react';
import { useShopStatus } from '../../context/ShopStatusContext';

export interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null;
  cartItems: any[];
  onUpdateQuantity: (item: any, variantQuantity: string, variantPrice: number, delta: number) => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  isOpen,
  onClose,
  item,
  cartItems,
  onUpdateQuantity,
}) => {
  const { shopStatus } = useShopStatus();
  const isShopOpen = shopStatus?.isOpen ?? true;

  if (!isOpen || !item) return null;

  // Extract variants: if item has priceVariants array, use it; otherwise fallback to standard variant
  const variants: Array<{ quantity: string; price: number; name?: string }> =
    item.priceVariants && item.priceVariants.length > 0
      ? item.priceVariants
      : [{ quantity: 'Standard', price: item.price || 120 }];

  // Helper to query quantity of a specific variant for this item in current cart
  const getVariantQty = (variantQuantity: string) => {
    const found = cartItems.find(
      (c) => c.menuItemId === item._id && (c.selectedVariant === variantQuantity || c.selectedVariant === variantQuantity.toLowerCase())
    );
    return found ? found.quantity : 0;
  };

  // Calculate total items of this dish across all variants
  const totalItemCount = variants.reduce((sum, v) => sum + getVariantQty(v.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Sheet / Dialog */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Item Summary */}
        <div className="relative p-4 sm:p-5 border-b border-neutral-100 flex items-center gap-3 sm:gap-4 bg-neutral-50/60">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200/80">
            <img
              src={item.image || '/images/product/placeholder.jpg'}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 mb-1">
              {item.categories?.[0] && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-burgundy bg-burgundy/10 px-2 py-0.5 rounded-full">
                  {item.categories[0]}
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 truncate">
              {item.name}
            </h3>
            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
              {item.description || 'Choose portion & customize quantity'}
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-neutral-200/90 text-neutral-400 hover:text-black flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-neutral-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Portion Options ({variants.length})
            </span>
            {!item.isAvailable || !isShopOpen ? (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                {!item.isAvailable ? 'Sold Out' : 'Kitchen Closed'}
              </span>
            ) : null}
          </div>

          {/* Variant Rows */}
          <div className="space-y-2.5">
            {variants.map((v) => {
              const qty = getVariantQty(v.quantity);
              const isAdded = qty > 0;
              const disabled = !item.isAvailable || !isShopOpen;

              return (
                <div
                  key={v.quantity}
                  className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    isAdded
                      ? 'border-burgundy/40 bg-burgundy/[0.03] shadow-xs'
                      : 'border-neutral-200/90 bg-white hover:border-neutral-300'
                  }`}
                >
                  {/* Variant Details */}
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-neutral-900 uppercase">
                        {v.quantity}
                      </span>
                      {v.quantity.toLowerCase().includes('half') && (
                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                          1/2 Portion
                        </span>
                      )}
                      {v.quantity.toLowerCase().includes('full') && (
                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                          Full Portion
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-black text-neutral-900 mt-0.5">
                      ₹{v.price.toFixed(0)}
                    </div>
                  </div>

                  {/* Quantity Stepper or Add button for this variant */}
                  <div>
                    {isAdded ? (
                      <div className="flex items-center bg-burgundy text-white rounded-full p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item, v.quantity, v.price, -1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-burgundy-400 hover:bg-burgundy-300 active:scale-95 flex items-center justify-center text-xs font-black transition-colors"
                          title="Decrease"
                        >
                          −
                        </button>
                        <span className="text-xs sm:text-sm font-black w-7 sm:w-8 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onUpdateQuantity(item, v.quantity, v.price, 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-burgundy-400 hover:bg-burgundy-300 active:scale-95 flex items-center justify-center text-xs font-black transition-colors disabled:opacity-40"
                          title="Increase"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onUpdateQuantity(item, v.quantity, v.price, 1)}
                        className="px-4 py-1.5 sm:py-2 rounded-full border border-neutral-300 hover:border-burgundy bg-white hover:bg-burgundy text-neutral-900 hover:text-white text-xs font-extrabold transition-all disabled:opacity-30 flex items-center gap-1 shadow-2xs active:scale-95"
                      >
                        <span>+</span>
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-white flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              Cart Items
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-neutral-900">
              {totalItemCount} {totalItemCount === 1 ? 'portion' : 'portions'} selected
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 sm:py-3 rounded-full bg-burgundy hover:bg-burgundy-600 active:scale-98 text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariantSelectionModal;
