import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItemDetailsOrchestrator } from '../../hooks/useItemDetailsOrchestrator';
import { useShopStatus } from '../../context/ShopStatusContext';
import { QueryBoundary } from '../../components/common/QueryBoundary';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shopStatus } = useShopStatus();
  const orchestrator = useItemDetailsOrchestrator(id);
  const isShopOpen = shopStatus?.isOpen ?? true;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="font-bold">Item Details</h1>
        <div className="w-6" />
      </div>

      <QueryBoundary query={orchestrator.queries.item}>
        {(item) => (
          <div className="max-w-4xl mx-auto p-4">
            <div className="grid md:grid-cols-2 gap-6 bg-white border border-gray-200 rounded p-6">
              {/* Image */}
              <div className="aspect-square rounded overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>

                {item.priceVariants?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase">Available Sizes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {item.priceVariants.map((v: any) => (
                        <button
                          key={v.quantity}
                          onClick={() => orchestrator.selection.variant.set(v.quantity, v.price)}
                          className={`p-3 rounded border text-left transition-all ${
                            orchestrator.selection.variant.value === v.quantity
                              ? 'border-red-600 bg-red-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <p className="text-xs text-gray-500">{v.quantity}</p>
                          <p className="text-lg font-bold text-red-600">₹{v.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isShopOpen && (
                  <div className="p-3 bg-yellow-50 border border-yellow-100 rounded text-yellow-800 text-xs font-medium">
                    Shop is closed for orders.
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  {orchestrator.selection.cartQuantity > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex border border-gray-200 rounded flex-1">
                        <button 
                          onClick={() => orchestrator.actions.updateCartQuantity(orchestrator.selection.cartQuantity - 1)}
                          className="flex-1 py-3 font-bold hover:bg-gray-100"
                        >-</button>
                        <span className="flex-1 py-3 text-center font-bold border-x border-gray-200">{orchestrator.selection.cartQuantity}</span>
                        <button 
                          onClick={() => orchestrator.actions.updateCartQuantity(orchestrator.selection.cartQuantity + 1)}
                          className="flex-1 py-3 font-bold hover:bg-gray-100"
                        >+</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={!isShopOpen}
                      onClick={orchestrator.actions.addToCart}
                      className="w-full bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Related */}
            <div className="mt-8 space-y-4">
              <h3 className="font-bold text-lg">You might also like</h3>
              <QueryBoundary query={orchestrator.queries.related}>
                {(related) => (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {related.data.menuItems.filter((i: any) => i._id !== id).slice(0, 4).map((i: any) => (
                      <Link key={i._id} to={`/customer/menu/${i._id}`} className="bg-white border border-gray-200 p-2 rounded hover:border-red-400 transition-all">
                        <img src={i.image} alt={i.name} className="aspect-square rounded object-cover mb-2" />
                        <p className="font-bold text-xs truncate">{i.name}</p>
                        <p className="text-red-600 font-bold text-xs">₹{i.priceVariants?.[0]?.price || i.price}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </QueryBoundary>
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
