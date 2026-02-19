import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMenuItem, MenuItem } from '../../services/customer-web.service';
import { useShopStatus } from '../../context/ShopStatusContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

// Cart item stored in localStorage
export interface CartItem {
    menuItemId: string;
    name: string;
    image: string;
    selectedVariant: string;
    price: number;
    quantity: number;
}

export default function ItemDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { shopStatus } = useShopStatus();
    const { customer } = useCustomerAuth();
    const isShopOpen = shopStatus?.isOpen ?? true;

    const [item, setItem] = useState<MenuItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<string>('');
    const [selectedPrice, setSelectedPrice] = useState<number>(0);
    const [quantity, setQuantity] = useState(1);
    const [existingQuantity, setExistingQuantity] = useState(0); // Quantity already in cart
    const [addingToCart, setAddingToCart] = useState(false);
    const [relatedItems, setRelatedItems] = useState<MenuItem[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    // Get quantity for currently selected variant from cart
    const getCartQuantity = () => {
        if (!item || !selectedVariant) return 0;
        const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
        const cartItem = cart.find(
            cartItem => cartItem.menuItemId === item._id && cartItem.selectedVariant === selectedVariant
        );
        return cartItem?.quantity || 0;
    };

    // Update existing quantity when variant changes
    useEffect(() => {
        setExistingQuantity(getCartQuantity());
    }, [selectedVariant, item]);

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const menuItem = await getMenuItem(id);
                setItem(menuItem);

                // Set default variant
                if (menuItem.priceVariants && menuItem.priceVariants.length > 0) {
                    const defaultVariant = menuItem.priceVariants[0];
                    setSelectedVariant(defaultVariant.quantity);
                    setSelectedPrice(defaultVariant.price);
                }

                // Fetch related items from same category
                if (menuItem.categories && menuItem.categories.length > 0) {
                    setLoadingRelated(true);
                    try {
                        const { getMenuItems } = await import('../../services/customer-web.service');
                        const response = await getMenuItems({
                            category: menuItem.categories[0],
                            limit: 10
                        });
                        // Filter out current item
                        const menuItems = response.data?.menuItems || [];
                        const filtered = menuItems.filter((i: MenuItem) => i._id !== menuItem._id && i.isAvailable);
                        setRelatedItems(filtered.slice(0, 6));
                    } catch (error) {
                        console.error('Error fetching related items:', error);
                    } finally {
                        setLoadingRelated(false);
                    }
                }
            } catch (error) {
                console.error('Error fetching item:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id]);

    const handleVariantChange = (quantity: string, price: number) => {
        setSelectedVariant(quantity);
        setSelectedPrice(price);
        setQuantity(1); // Reset quantity when changing variant
    };

    const handleAddToCart = () => {
        if (!item || !selectedVariant) return;

        setAddingToCart(true);

        try {
            // Get existing cart from localStorage
            const existingCart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];

            // Check if item with same variant already exists
            const existingItemIndex = existingCart.findIndex(
                cartItem => cartItem.menuItemId === item._id && cartItem.selectedVariant === selectedVariant
            );

            if (existingItemIndex !== -1) {
                // Update quantity
                existingCart[existingItemIndex].quantity += quantity;
            } else {
                // Add new item
                const cartItem: CartItem = {
                    menuItemId: item._id,
                    name: item.name,
                    image: item.image,
                    selectedVariant,
                    price: selectedPrice,
                    quantity,
                };
                existingCart.push(cartItem);
            }

            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(existingCart));

            // Dispatch custom event to update cart count in navbar
            window.dispatchEvent(new Event('cartUpdated'));

            // Update existing quantity
            setExistingQuantity(getCartQuantity());

            // Show success toast notification
            const toast = document.createElement('div');
            toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in';
            toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">Added to cart!</span>
      `;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 300ms';
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);

            // Reset quantity to 1
            setQuantity(1);
        } catch (error) {
            console.error('Error adding to cart:', error);

            // Show error toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
            toast.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">Failed to add item</span>
      `;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 300ms';
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleUpdateQuantity = (newQuantity: number) => {
        if (!item || !selectedVariant) return;

        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
            const itemIndex = cart.findIndex(
                cartItem => cartItem.menuItemId === item._id && cartItem.selectedVariant === selectedVariant
            );

            if (itemIndex !== -1) {
                if (newQuantity <= 0) {
                    // Remove item from cart
                    cart.splice(itemIndex, 1);
                } else {
                    // Update quantity
                    cart[itemIndex].quantity = newQuantity;
                }

                localStorage.setItem('cart', JSON.stringify(cart));
                window.dispatchEvent(new Event('cartUpdated'));
                setExistingQuantity(newQuantity);
            }
        } catch (error) {
            console.error('Error updating cart quantity:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center font-outfit">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-800"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Loading item details...</p>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center font-outfit">
                <div className="text-center px-4">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Item Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">The item you're looking for doesn't exist or has been removed.</p>
                    <Link
                        to="/customer/menu"
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Menu
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-outfit">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Menu
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Image Section */}
                    <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden">
                        <img
                            src={item.image || '/images/product/placeholder.jpg'}
                            alt={item.name}
                            className="w-full h-96 lg:h-[500px] object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                            }}
                        />
                        {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center">
                                    <svg className="w-12 h-12 text-white mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="text-white font-bold text-base">Currently Unavailable</span>
                                </div>
                            </div>
                        )}

                        {/* Floating Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {item.categories && item.categories.length > 0 && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-sm">
                                    {item.categories[0]}
                                </span>
                            )}
                            {item.isAvailable && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-500/90 backdrop-blur-sm text-xs font-semibold text-white shadow-sm">
                                    <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Available
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="sm:p-8 lg:p-10">
                        <div className="mb-5">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5">{item.name}</h1>
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="font-semibold text-gray-900 dark:text-white">{item.rating.toFixed(1)}</span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span>{item.reviews} {item.reviews === 1 ? 'review' : 'reviews'}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
                        </div>

                        {/* Price Variants / Size Selection */}
                        {item.priceVariants && item.priceVariants.length > 0 && (
                            <div className="mb-3">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                                    Select Size
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {item.priceVariants.map((variant) => (
                                        <button
                                            key={variant.quantity}
                                            onClick={() => handleVariantChange(variant.quantity, variant.price)}
                                            className={`p-3 border-2 rounded-lg text-left transition-all duration-200 ${selectedVariant === variant.quantity
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                                                } ${!item.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={!item.isAvailable}
                                        >
                                            <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-0.5">{variant.quantity}</div>
                                            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">₹{variant.price.toFixed(0)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Total and Add to Cart */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Price</span>
                                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                    ₹{(selectedPrice * (existingQuantity > 0 ? existingQuantity : quantity)).toFixed(0)}
                                </span>
                            </div>

                            {!isShopOpen && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-200 p-3 mb-4 rounded-r-lg">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        <p className="font-medium text-xs">We're currently closed. Please try again later.</p>
                                    </div>
                                </div>
                            )}

                            {!customer && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 p-3 mb-4 rounded-lg">
                                    <div className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs">
                                            <Link to="/customer/login" className="underline font-semibold hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">Login</Link> for a better experience - track orders, save addresses & more!
                                        </p>
                                    </div>
                                </div>
                            )}

                            {existingQuantity > 0 ? (
                                // Show quantity controls if item is already in cart
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleUpdateQuantity(existingQuantity - 1)}
                                        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-gray-700 dark:text-gray-300"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <div className="flex-1 text-center py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <span className="text-base font-bold text-gray-900 dark:text-white">{existingQuantity}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">in cart</span>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateQuantity(existingQuantity + 1)}
                                        disabled={!item.isAvailable || !isShopOpen}
                                        className="w-10 h-10 rounded-lg border-2 border-indigo-600 dark:border-indigo-500 bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:border-indigo-700 dark:hover:border-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:border-gray-400 dark:disabled:border-gray-600 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                // Show add to cart button if item is not in cart
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!item.isAvailable || !isShopOpen || addingToCart}
                                    className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {addingToCart ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Adding...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span>Add to Cart</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* You Might Also Like */}
                        {relatedItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">You Might Also Like</h3>
                                {loadingRelated ? (
                                    <div className="flex justify-center py-8">
                                        <div className="relative w-12 h-12">
                                            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-800"></div>
                                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {relatedItems.map((relatedItem) => {
                                            const lowestPrice = relatedItem.priceVariants && relatedItem.priceVariants.length > 0
                                                ? Math.min(...relatedItem.priceVariants.map(v => v.price))
                                                : 0;

                                            return (
                                                <Link
                                                    key={relatedItem._id}
                                                    to={`/customer/menu/${relatedItem._id}`}
                                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200 group"
                                                >
                                                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                                                        <img
                                                            src={relatedItem.image || '/images/product/placeholder.jpg'}
                                                            alt={relatedItem.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/images/product/placeholder.jpg';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="p-3">
                                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">
                                                            {relatedItem.name}
                                                        </h4>
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                                    ₹{lowestPrice.toFixed(0)}
                                                                </span>
                                                                {relatedItem.priceVariants && relatedItem.priceVariants.length > 1 && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">onwards</span>
                                                                )}
                                                            </div>
                                                            {relatedItem.rating && (
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{relatedItem.rating}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
