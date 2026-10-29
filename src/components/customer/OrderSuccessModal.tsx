import React from 'react';
import { Link } from 'react-router-dom';
import { formatOrderNumberForDisplay } from '../../utils/orderNumber';

interface OrderSuccessModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  order,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber ? formatOrderNumberForDisplay(order.orderNumber) : '';
  const total = order.totalAmount || order.pricing?.finalAmount || 0;
  const area = order.deliveryAddress?.area || 'Delivery address';
  const addressLine = order.deliveryAddress?.addressLine || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center animate-in zoom-in-95 duration-200">
        {/* Animated Green Checkmark Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
          <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 mb-2">
          ORDER CONFIRMED
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-neutral-950 dark:text-white">
          Order Placed Successfully!
        </h3>

        {orderNum && (
          <p className="text-sm font-extrabold text-burgundy mt-1">
            Order #{orderNum}
          </p>
        )}

        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
          The restaurant has received your order and started preparing your food.
        </p>

        {/* Order Details Brief Card */}
        <div className="mt-5 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-750 text-left text-xs space-y-2">
          <div className="flex justify-between font-medium text-neutral-600 dark:text-neutral-400">
            <span>Delivering To:</span>
            <span className="font-bold text-neutral-900 dark:text-white text-right max-w-[200px] truncate">
              {addressLine ? `${addressLine}, ${area}` : area}
            </span>
          </div>
          <div className="flex justify-between font-medium text-neutral-600 dark:text-neutral-400">
            <span>Payment Mode:</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {order.paymentMethod === 'COD' ? 'Cash / UPI on Delivery' : order.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between font-medium text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-200/60 dark:border-neutral-700">
            <span className="font-bold text-neutral-900 dark:text-white">Total Amount:</span>
            <span className="font-extrabold text-neutral-950 dark:text-white text-sm">
              ₹{Number(total).toFixed(0)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <Link
            to="/customer/orders"
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-full bg-burgundy hover:bg-burgundy-600 text-white font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
          >
            <span>Go to My Orders to track meal →</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-full text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Close & Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
