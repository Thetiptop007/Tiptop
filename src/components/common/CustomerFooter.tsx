import React from 'react';
import { Link } from 'react-router-dom';

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="bg-neutral-950 text-white pt-16 pb-12 border-t border-burgundy/40 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block group py-1">
              <img
                src="/logo-full.png"
                alt="TipTop"
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-sm"
              />
            </Link>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              Law Gate, Near LPU, Phagwara, Punjab. Bringing authentic flavors, fresh local ingredients, and fast hot food delivered right to your place.
            </p>
          </div>

          {/* Quick Menu */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
              Menu
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li><Link to="/customer/menu?category=Burgers" className="hover:text-white transition-colors">Burgers</Link></li>
              <li><Link to="/customer/menu?category=Pizza" className="hover:text-white transition-colors">Pizza</Link></li>
              <li><Link to="/customer/menu?category=Offer" className="hover:text-white transition-colors">Offers & Combos</Link></li>
              <li><Link to="/customer/menu" className="hover:text-white transition-colors">All Dishes</Link></li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/customer/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
              <li><Link to="/customer/profile" className="hover:text-white transition-colors">My Profile</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
              Contact Us
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li>+91 7696482938</li>
              <li>contact@thetiptop.in</li>
              <li>Open Daily 11 AM - 11 PM</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} TipTop Restaurant. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Fresh • Fast • Delicious</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default CustomerFooter;
