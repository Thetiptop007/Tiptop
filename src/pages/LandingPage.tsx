import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getSettings, Settings } from "../services/settings.service";

export default function LandingPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Dish Card 1 */}
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

          {/* Dish Card 2 */}
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

          {/* Dish Card 3 */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
            {/* APK Download */}
            <a
              href={settings?.apkDownloadUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-[#e36057] hover:shadow-lg transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#e36057]"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900">
                <svg className="w-7 h-7 text-[#e36057]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.523 7C17.086 4.671 15.199 3 13 3c-2.6 0-4.5 2.2-4.5 4.9 0 .3 0 .6.1.9C6.2 8.3 4 10.1 4 12.4c0 2.5 2.1 4.6 4.7 4.6h8.6c2.1 0 3.7-1.7 3.7-3.7 0-2-1.6-3.6-3.5-3.6v-.1c0-.9-.1-1.8-.2-2.6zM13 17l-4-4h2.5V9h3v4H17l-4 4z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">
                  Download APK
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Install directly on Android
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Indus AppStore */}
            <a
              href={settings?.indusAppStoreUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-[#e36057] hover:shadow-lg transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#e36057]"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900">
                <svg className="w-7 h-7 text-[#e36057]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-800 dark:text-white/90 mb-1">
                  Indus AppStore
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get it from Indus AppStore
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Available for Android devices • Version 1.0.0
            </p>
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
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center px-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 pb-6">
          © 2026 The Tip Top. All rights reserved.
        </p>
      </div>
    </div>
  );
}
