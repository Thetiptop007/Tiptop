import { usePaymentOrchestrator } from "../../hooks/usePaymentOrchestrator";
import { QueryBoundary } from "../../components/common/QueryBoundary";
import { Link, useNavigate } from "react-router";

export default function Payment() {
  const navigate = useNavigate();
  const orchestrator = usePaymentOrchestrator();

  if (orchestrator.status.orderSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-8">Order ID: {orchestrator.status.orderData?.orderNumber}</p>
        <button
          onClick={() => navigate('/customer/orders')}
          className="w-full max-w-xs bg-red-600 text-white py-3 rounded font-bold"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-lg">Checkout</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {/* Address */}
        <div className="bg-white border border-gray-200 p-4 rounded">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">Delivery Address</h2>
            <Link to="/customer/addresses" className="text-xs font-bold text-red-600">Change</Link>
          </div>
          <QueryBoundary query={orchestrator.queries.addresses}>
            {(addresses) => (
              <div className="space-y-2">
                {addresses.map(addr => (
                  <div
                    key={addr._id}
                    onClick={() => orchestrator.selection.addressId.set(addr._id || '')}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      orchestrator.selection.addressId.value === addr._id
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <p className="text-xs font-bold capitalize">{addr.label || addr.type} {addr.isDefault && '(Default)'}</p>
                    <p className="text-xs text-gray-500 mt-1">{addr.street}, {addr.city}</p>
                  </div>
                ))}
              </div>
            )}
          </QueryBoundary>
        </div>

        {/* Payment Method */}
        <div className="bg-white border border-gray-200 p-4 rounded">
          <h2 className="font-bold text-sm mb-4">Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['COD', 'UPI'] as const).map(method => (
              <button
                key={method}
                onClick={() => orchestrator.selection.paymentMethod.set(method)}
                className={`py-3 rounded border font-bold text-xs transition-all ${
                  orchestrator.selection.paymentMethod.value === method
                    ? 'border-red-600 text-red-600 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                {method === 'COD' ? 'Cash on Delivery' : 'Pay via UPI'}
              </button>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white border border-gray-200 p-4 rounded space-y-3">
          <h2 className="font-bold text-sm">Order Summary</h2>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{orchestrator.cart.summary.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax & Charges</span>
              <span>₹{orchestrator.cart.summary.tax}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₹{orchestrator.cart.summary.delivery}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-sm text-black">
              <span>Total Amount</span>
              <span className="text-red-600">₹{orchestrator.cart.summary.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Place Order */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-10">
        <div className="max-w-xl mx-auto">
          <button
            disabled={orchestrator.status.submitting}
            onClick={orchestrator.actions.placeOrder}
            className="w-full bg-red-600 text-white py-4 rounded font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {orchestrator.status.submitting ? 'Processing...' : `Place Order • ₹${orchestrator.cart.summary.total}`}
          </button>
        </div>
      </div>
    </div>
  );
}