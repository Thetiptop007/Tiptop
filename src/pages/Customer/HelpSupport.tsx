import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getSettings, type Settings } from '../../services/settings.service';

const HelpSupport: React.FC = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch settings for Help & Support:', error);
      }
    };

    fetchSettings();
  }, []);

  const supportEmail = settings?.contactEmail || 'support@tiptop.com';
  const supportPhone = settings?.contactPhone || '+91 90605 57296';
  const supportAddress = settings?.businessAddress || 'TipTop Restaurant, Main Street, City Center';

  const faqs = [
    {
      id: 1,
      question: 'How do I place an order quickly?',
      answer: 'Browse our menu, click "Order Now" on any item to open the 1-Click Fast Checkout modal, choose your address and payment, and confirm.'
    },
    {
      id: 2,
      question: 'What are your delivery hours?',
      answer: 'We deliver fresh hot meals from 10:00 AM to 10:00 PM every day. Check our live kitchen status indicator on the menu header.'
    },
    {
      id: 3,
      question: 'How can I track my live order?',
      answer: 'Go to "Track Orders" in the navigation bar to see real-time updates as your food is prepared and dispatched.'
    },
    {
      id: 4,
      question: 'What payment methods do you accept?',
      answer: 'We support Cash on Delivery (COD) as well as online UPI and card options.'
    },
    {
      id: 5,
      question: 'How do I manage my delivery addresses?',
      answer: 'Go to Account > Saved Addresses to add your home, workplace, or hostel addresses for effortless 1-click ordering.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-neutral-900 font-sans pb-24">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/customer/profile')}
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black mb-2 transition-colors group"
          >
            <svg className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Profile
          </button>
          <h1 className="text-3xl font-extrabold text-neutral-950 tracking-tight">Help & Support</h1>
        </div>

        {/* Contact Quick Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-2xs">
            <span className="text-2xl mb-2 block">📞</span>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Call Us</p>
            <a href={`tel:${supportPhone}`} className="text-base font-extrabold text-neutral-950 hover:underline">
              {supportPhone}
            </a>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-2xs">
            <span className="text-2xl mb-2 block">✉️</span>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Email Us</p>
            <a href={`mailto:${supportEmail}`} className="text-base font-extrabold text-neutral-950 hover:underline">
              {supportEmail}
            </a>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-xs mb-8">
          <h2 className="text-xl font-extrabold text-neutral-950 mb-6">Frequently Asked Questions</h2>
          <div className="divide-y divide-neutral-100">
            {faqs.map((faq) => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div key={faq.id} className="py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                    className="w-full flex justify-between items-center text-left text-sm font-bold text-neutral-900 hover:text-black gap-4"
                  >
                    <span>{faq.question}</span>
                    <span className="text-neutral-400 font-extrabold text-lg">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Location */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-2xs text-center">
          <p className="text-xs text-neutral-500 font-medium">📍 Restaurant Address</p>
          <p className="text-sm font-extrabold text-neutral-900 mt-1">{supportAddress}</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
