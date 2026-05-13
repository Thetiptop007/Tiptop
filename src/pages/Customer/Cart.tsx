import { Link, useNavigate } from 'react-router-dom';
import { useCartOrchestrator } from '../../hooks/useCartOrchestrator';
import ApplicableOffers from '../../components/customer/ApplicableOffers';

export default function Cart() {
  const navigate = useNavigate();
  const orchestrator = useCartOrchestrator();

  if (orchestrator.items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-2">Cart is Empty</h2>
        <p className="text-gray-500 mb-6 text-sm text-center">Add some delicious items to get started!</p>
        <Link to="/customer/menu" className="bg-red-600 text-white px-8 py-3 rounded font-bold">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Simple Header */}
      <div className="bg-white px-4 py-4 border-b sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="font-bold text-lg">My Cart</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {!orchestrator.status.isOpen && (
          <div className="p-3 bg-yellow-50 border border-yellow-100 rounded text-yellow-800 text-xs font-medium">
            Note: We are not accepting orders right now.
          </div>
        )}

        {/* Cart Items */}
        <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100 overflow-hidden">
          {orchestrator.items.map((item, i) => (
            <div key={i} className="p-4 flex gap-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-sm truncate">{item.name}</h3>
                  <button onClick={() => orchestrator.actions.removeItem(i)} className="text-gray-300 hover:text-red-600">✕</button>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">{item.selectedVariant}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-red-600">₹{item.price}</span>
                  <div className="flex border border-gray-200 rounded">
                    <button onClick={() => orchestrator.actions.updateQuantity(i, -1)} className="px-2 py-1 text-xs hover:bg-gray-100">-</button>
                    <span className="px-3 py-1 text-xs font-bold border-x border-gray-200">{item.quantity}</span>
                    <button onClick={() => orchestrator.actions.updateQuantity(i, 1)} className="px-2 py-1 text-xs hover:bg-gray-100">+</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Offers */}
        <ApplicableOffers
          cartItems={orchestrator.items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity, price: i.price }))}
          orderAmount={orchestrator.summary.subtotal}
        />

        {/* Bill Details */}
        <div className="bg-white border border-gray-200 p-4 rounded space-y-3">
          <h2 className="font-bold text-sm">Order Summary</h2>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>₹{orchestrator.summary.subtotal}</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
            <span>Total Amount</span>
            <span className="text-red-600">₹{orchestrator.summary.total}</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-10 shadow-sm">
        <div className="max-w-xl mx-auto">
          <button
            disabled={!orchestrator.status.isOpen}
            onClick={() => navigate('/customer/payment')}
            className="w-full bg-red-600 text-white py-4 rounded font-bold hover:bg-red-700 disabled:opacity-50"
          >
            Continue to Payment • ₹{orchestrator.summary.total}
          </button>
        </div>
      </div>
    </div>
  );
}
