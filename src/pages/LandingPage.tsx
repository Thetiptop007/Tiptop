import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getSettings, Settings } from "../services/settings.service";
import { getPopularItems, MenuItem } from "../services/menu-management.service";
import Footer from "../components/common/Footer";

export default function LandingPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [popularDishes, setPopularDishes] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('🏠 LandingPage: Component rendering');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsData, popularItems] = await Promise.all([
          getSettings(),
          getPopularItems(3)
        ]);
        
        setSettings(settingsData);
        setPopularDishes(popularItems);
        console.log('✅ LandingPage: Fetched popular items', popularItems);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src="/logo-full.png" alt="The Tip Top" className="h-10" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 px-4 md:px-6 lg:px-20 py-10 md:py-16 max-w-7xl mx-auto">
        <div className="flex flex-col justify-center">
          <div className="w-fit flex gap-3 items-center rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 font-medium shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-14 h-10 md:w-16 md:h-12 bg-[#e36057] flex justify-center items-center">
              <img src="/heroImage.png" alt="heroImage small" className="w-8 md:w-10" />
            </div>
            <div className="pr-4 text-sm text-gray-800 dark:text-white/90">
              Food, Taste, Quality
            </div>
          </div>
          <h1 className="mt-6 md:mt-8 text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 dark:text-white/90 leading-tight">
            Eat <span className="text-[#e36057]">Finest</span> Flavours at Finest Vibezz
          </h1>
          <p className="mt-4 md:mt-6 text-sm md:text-base text-gray-500 dark:text-gray-400">
            Get your food at the comfort of your place, delivered fresh and fast to your doorstep.
          </p>
          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/order"
              className="inline-block rounded-lg bg-[#e36057] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#d14f47] transition-colors dark:hover:bg-[#e36057] text-center"
            >
              Order Now
            </Link>
            <a
              href="#download-app"
              className="inline-block rounded-lg border-2 border-[#e36057] px-6 py-2.5 text-sm font-medium text-[#e36057] hover:bg-red-50 transition-colors dark:border-[#e36057] dark:hover:bg-red-900/10 text-center"
            >
              Download App
            </a>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="rounded-2xl overflow-hidden">
            <img src="/heroImage.png" alt="heroImage" className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Popular Dishes Section */}
      <div className="px-4 md:px-6 lg:px-20 py-10 md:py-16 max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white/90">
            Our Popular Dishes
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Explore our most loved menu items
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : popularDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {popularDishes.map((dish) => (
              <div key={dish.id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 dark:text-white/90 mb-2">
                    {dish.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {dish.description}
                  </p>
                  {dish.priceVariants && dish.priceVariants.length > 0 && (
                    <p className="text-sm font-semibold text-[#e36057]">
                      Starting from ₹{Math.min(...dish.priceVariants.map(v => v.price))}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Default dishes as fallback */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden">
                <img
                  src="https://img.freepik.com/free-photo/indian-butter-chicken-black-bowl-isolated-white_123827-20098.jpg"
                  alt="Tandoori Chicken"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-800 dark:text-white/90 mb-2">
                  Tandoori Chicken
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Perfectly marinated and grilled to perfection
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden">
                <img
                  src="https://img.freepik.com/free-photo/indian-paneer-tikka-kabab-made-cottage-cheese-served-with-mint-chutney_466689-76250.jpg"
                  alt="Shahi Paneer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-800 dark:text-white/90 mb-2">
                  Shahi Paneer
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Rich and creamy cottage cheese curry
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden">
                <img
                  src="https://img.freepik.com/free-photo/delicious-indian-biryani-with-chicken-plate_23-2150696018.jpg"
                  alt="Chicken Dum Biryani"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-800 dark:text-white/90 mb-2">
                  Chicken Dum Biryani
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aromatic basmati rice with succulent chicken
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8 md:mt-12 flex justify-center">
          <Link
            to="/order"
            className="rounded-lg bg-[#e36057] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#d14f47] transition-colors dark:hover:bg-[#e36057]"
          >
            See All Dishes
          </Link>
        </div>
      </div>

      {/* Download App Section */}
      <div id="download-app" className="px-4 md:px-6 lg:px-20 py-10 md:py-16 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-gray-800 dark:from-red-950/20 dark:to-orange-950/20 p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white/90 mb-3">
              Download Our App
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get the best food ordering experience on your mobile device
            </p>
          </div>

          {/* Installation Instructions */}
          <div className="max-w-3xl mx-auto mb-8 p-4 md:p-6 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm md:text-base">Installation Instructions</h3>
                <ul className="space-y-1.5 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Click "Download APK" to download the app file (approx 108 MB)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>After download, open the APK file from your notifications or downloads folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>If prompted, enable "Install from unknown sources" in your device settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Tap "Install" and wait for the installation to complete</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="max-w-3xl mx-auto mb-6 p-3 md:p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs md:text-sm text-amber-800 dark:text-amber-200">
                <strong>Security Notice:</strong> You may see a warning about installing apps from unknown sources. This is normal for apps not downloaded from Google Play Store. Our app is safe to install.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
            <a
              href={settings?.apkDownloadUrl || "#"}
              download
              className="flex items-center gap-4 rounded-xl border-2 border-[#e36057] bg-white p-5 hover:bg-red-50 hover:shadow-lg transition-all dark:border-[#e36057] dark:bg-gray-800 dark:hover:bg-red-900/10"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900">
                <svg className="w-7 h-7 text-[#e36057]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">
                  Download APK
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Android v1.0.5 • 108 MB
                </p>
              </div>
              <svg className="w-5 h-5 text-[#e36057]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            <Link
              to="/order"
              className="flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-blue-500 hover:shadow-lg transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900">
                <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">
                  iOS / Other Users
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Order via Website
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-16 md:mt-20 bg-gradient-to-b from-red-50 dark:from-red-950/20 to-transparent rounded-t-[60px] md:rounded-t-[120px] px-4 md:px-6 lg:px-20 py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white/90">
              How Does It Work
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Simple steps to get your favorite food
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 shadow-lg">
                  <img
                    src="https://img.freepik.com/free-vector/hand-drawn-people-taking-pictures-food-illustration_23-2150504673.jpg"
                    alt="Choose Your Meal"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#e36057] mb-3">
                Choose Your Meal
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                See the menu area for all of our dishes. Decide on your preferred dish and serving size.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 shadow-lg">
                  <img
                    src="https://img.freepik.com/free-vector/set-different-bubbles-chat-messenger-app_23-2147785718.jpg"
                    alt="Confirm Your Order"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#e36057] mb-3">
                Confirm Your Order
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Confirm your order on whatsapp and wait for delivery. Free delivery on orders above ₹100/-
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 shadow-lg">
                  <img
                    src="https://img.freepik.com/free-vector/cash-delivery-courier-client_23-2148788572.jpg"
                    alt="Collect Your Meal"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#e36057] mb-3">
                Collect Your Meal
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Collect your meal and enjoy it. Visit again to get best food.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
