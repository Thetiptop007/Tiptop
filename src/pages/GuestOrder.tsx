import { useState, useEffect, useRef } from "react";
import { useGuestOrderOrchestrator } from "../hooks/useGuestOrderOrchestrator";
import { useCustomerMenuQuery, usePublicBootstrap } from "../hooks/useAppDataQueries";

import { QueryBoundary } from "../components/common/QueryBoundary";
import { Link } from "react-router";
import OfferBanner from "../components/customer/OfferBanner";
import { formatOrderNumberForDisplay } from "../utils/orderNumber";

const SERVICE_AREAS = [
  { id: 'law_gate', name: 'Law Gate' },
  { id: 't_point', name: 'T Point' },
  { id: 'green_valley', name: 'Green Valley' },
  { id: 'bhutani_colony', name: 'Bhutani Colony' },
  { id: 'riya_hostel', name: 'Riya Girls Hostel' },
];

export default function GuestOrder() {
  const orchestrator = useGuestOrderOrchestrator();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  
  // Queries
  const { categories = ["All"], isLoading: isBootstrapLoading } = usePublicBootstrap();
  const menuQuery = useCustomerMenuQuery({
    page,
    limit: 12,
    category: orchestrator.menu.category.selected !== 'All' ? orchestrator.menu.category.selected : undefined,
    search: orchestrator.menu.search.value || undefined,
    isAvailable: true
  });


  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  // Notification Permission Logic
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission !== 'granted') {
        const timer = setTimeout(() => setShowNotificationBanner(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
        setShowCategoryFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset page on search or category change
  useEffect(() => {
    setPage(1);
  }, [orchestrator.menu.category.selected, orchestrator.menu.search.value]);

  if (orchestrator.status.orderSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">Order Confirmed!</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Your order has been confirmed and accepted. We'll start preparing it right away!</p>
          <div className="mb-6 rounded-lg bg-brand-50 dark:bg-brand-950/20 p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Order Number</p>
            <p className="text-2xl font-bold text-brand-500">{formatOrderNumberForDisplay(orchestrator.status.orderNumber)}</p>
          </div>

          <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-left">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">No WhatsApp Required!</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">Your order is confirmed without needing WhatsApp confirmation. We've received it directly through our system.</p>
              </div>
            </div>
          </div>
          <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 text-left">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Call for Assistance</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">If you have any questions or need to cancel, please call us at <a href="tel:+917696482938" className="text-blue-600 font-bold">7696482938</a>.</p>
              </div>
            </div>
          </div>
          <Link to="/" className="inline-block w-full rounded-lg bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-gray-900">
      {/* Notification Permission Banner */}
      {showNotificationBanner && notificationPermission === 'default' && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:w-96">
          <div className="rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">Enable Notifications</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Get real-time updates on your order status.</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { Notification.requestPermission().then(p => setNotificationPermission(p)); setShowNotificationBanner(false); }} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">Enable</button>
                  <button onClick={() => setShowNotificationBanner(false)} className="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">Later</button>
                </div>
              </div>
              <button onClick={() => setShowNotificationBanner(false)} className="text-blue-600 p-1"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <OfferBanner />
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Order as Guest</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Browse our menu and place your order.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Menu Items Section */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 p-4 dark:border-gray-800 flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={orchestrator.menu.search.value}
                    onChange={(e) => orchestrator.menu.search.set(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"

                  />
                  <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="relative" ref={categoryFilterRef}>
                  <button onClick={() => setShowCategoryFilter(!showCategoryFilter)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    {isBootstrapLoading ? (
                      <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                    ) : (
                      orchestrator.menu.category.selected === "All" ? "Categories" : orchestrator.menu.category.selected
                    )}
                  </button>


                  {showCategoryFilter && (
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 p-1 max-h-64 overflow-y-auto">
                      {categories.map(cat => (
                        <button key={cat} onClick={() => { orchestrator.menu.category.set(cat); setShowCategoryFilter(false); }} className={`w-full rounded-md px-3 py-2 text-left text-sm ${orchestrator.menu.category.selected === cat ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>{cat}</button>

                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <QueryBoundary 
                  query={menuQuery} 
                  isEmpty={(data) => !data?.data?.menuItems?.length}
                  loadingComponent={
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
                          <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 mb-3"></div>
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3"></div>
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4"></div>
                        </div>
                      ))}
                    </div>
                  }
                >

                  {(data) => {
                    const menuItems = data.data.menuItems;
                    const pagination = data.pagination;

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                          {menuItems.map((item: any) => (
                            <div key={item._id} onClick={() => setSelectedItem(item)} className="group rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-brand-500 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] cursor-pointer">

                              <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                              <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90 line-clamp-2">{item.name}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.categories?.[0] || 'Menu'}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-brand-500">₹{(item.priceVariants?.[0]?.price || item.price).toFixed(2)}</span>
                              </div>

                            </div>
                          ))}
                        </div>

                        {/* Pagination Controls */}
                        {pagination && pagination.totalPages > 1 && (
                          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row border-t border-gray-100 dark:border-gray-800 pt-6">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Page {pagination.currentPage} of {pagination.totalPages}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={pagination.currentPage === 1}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                  pagination.currentPage === 1
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                              >
                                Prev
                              </button>

                              <div className="flex gap-1">
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                                  const showPage =
                                    p === 1 ||
                                    p === pagination.totalPages ||
                                    (p >= pagination.currentPage - 1 && p <= pagination.currentPage + 1);

                                  const showEllipsis =
                                    (p === pagination.currentPage - 2 && pagination.currentPage > 3) ||
                                    (p === pagination.currentPage + 2 && pagination.currentPage < pagination.totalPages - 2);

                                  if (showEllipsis) {
                                    return (
                                      <span key={p} className="px-2 py-2 text-sm text-gray-400 dark:text-gray-600">
                                        ...
                                      </span>
                                    );
                                  }

                                  if (!showPage) return null;

                                  return (
                                    <button
                                      key={p}
                                      onClick={() => setPage(p)}
                                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        pagination.currentPage === p
                                          ? "bg-brand-500 text-white"
                                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                  pagination.currentPage === pagination.totalPages
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  }}
                </QueryBoundary>
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div id="cart-section" className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                <h2 className="text-lg font-semibold">Order Cart</h2>
                <p className="text-sm text-gray-500">{orchestrator.cart.items.length} items</p>
              </div>

              <div className="max-h-[300px] overflow-y-auto border-b border-gray-200 p-4 dark:border-gray-800 space-y-3">
                {orchestrator.cart.items.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">Your cart is empty</div>
                ) : (
                  orchestrator.cart.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">{item.name}</h4>
                        <p className="text-xs text-brand-500">{item.variant}</p>

                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center border border-gray-200 rounded">
                            <button onClick={() => orchestrator.cart.actions.update(item.id, item.variant, -1)} className="px-2 py-0.5 text-xs">-</button>
                            <span className="px-2 text-xs font-bold border-x border-gray-200">{item.quantity}</span>
                            <button onClick={() => orchestrator.cart.actions.update(item.id, item.variant, 1)} className="px-2 py-0.5 text-xs">+</button>
                          </div>
                          <span className="text-xs font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {orchestrator.cart.items.length > 0 && (
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <input type="text" value={orchestrator.customer.info.name} onChange={e => orchestrator.customer.set({...orchestrator.customer.info, name: e.target.value})} placeholder="Your Name *" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 outline-none dark:border-gray-700 dark:bg-gray-800" />
                    <input type="tel" value={orchestrator.customer.info.phone} onChange={e => orchestrator.customer.set({...orchestrator.customer.info, phone: e.target.value})} placeholder="Phone Number *" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 outline-none dark:border-gray-700 dark:bg-gray-800" />
                    <select value={orchestrator.customer.info.area} onChange={e => orchestrator.customer.set({...orchestrator.customer.info, area: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 outline-none dark:border-gray-700 dark:bg-gray-800">
                      {SERVICE_AREAS.map(area => <option key={area.id} value={area.name}>{area.name}</option>)}
                    </select>
                    <input type="text" value={orchestrator.customer.info.apartmentName} onChange={e => orchestrator.customer.set({...orchestrator.customer.info, apartmentName: e.target.value})} placeholder="Street address / Apartment *" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 outline-none dark:border-gray-700 dark:bg-gray-800" />

                  </div>

                  <div className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{orchestrator.cart.summary.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white"><span>Total</span><span className="text-brand-500">₹{orchestrator.cart.summary.total.toFixed(2)}</span></div>

                  </div>

                  <button disabled={orchestrator.status.submitting || !orchestrator.shopOpen || isBootstrapLoading} onClick={orchestrator.actions.placeOrder} className="w-full rounded-lg bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
                    {orchestrator.status.submitting ? 'Placing Order...' : 'Place Order (COD)'}
                  </button>


                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Variant Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedItem(null)}>
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">✕</button>
            <img src={selectedItem.image} alt={selectedItem.name} className="mb-4 h-40 w-full rounded-lg object-cover" />
            <h3 className="text-xl font-bold mb-2">{selectedItem.name}</h3>
            <div className="space-y-2">
              {selectedItem.priceVariants?.map((v: any) => (
                <button key={v.quantity} onClick={() => { orchestrator.cart.actions.add(selectedItem, v); setSelectedItem(null); }} className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:bg-brand-500/10">
                  <span className="font-bold">{v.quantity}</span>
                  <span className="font-bold text-brand-500">₹{v.price.toFixed(2)}</span>
                </button>

              ))}
              {!selectedItem.priceVariants?.length && (
                <button onClick={() => { orchestrator.cart.actions.add(selectedItem, { quantity: 'Full', price: selectedItem.price }); setSelectedItem(null); }} className="w-full rounded-lg bg-brand-500 py-3 font-bold text-white hover:bg-brand-600 transition-colors">Add to Cart - ₹{selectedItem.price.toFixed(2)}</button>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
