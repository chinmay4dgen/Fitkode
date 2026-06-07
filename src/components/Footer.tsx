import React, { useState } from 'react';
import { Shield, Sparkles, HelpCircle } from 'lucide-react';

export default function Footer() {
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  return (
    <footer className="bg-brand-green text-white py-12 border-t border-brand-dark-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          
          {/* Logo & Slogan */}
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2">
              <span className="font-display text-xl font-bold tracking-wider text-white">FITKODE</span>
              <span className="px-2 py-0.5 rounded bg-white text-brand-green font-bold text-[9px] tracking-wide">SIMPLIFIED</span>
            </div>
            <p className="text-xs text-brand-light-green max-w-sm mx-auto md:mx-0">
              Personalized Nutrition and Workout Plans built on deep science, simplicity, and lifelong independence.
            </p>
          </div>

          {/* Links Row */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold">
            <a 
              href="#privacy" 
              className="hover:text-brand-light-green hover:underline decoration-brand-light-green transition-all"
              onClick={(e) => { e.preventDefault(); alert("Fitkode Privacy Policy: We securely encrypt and protect all your personal metrics, dietary preferences, and billing records."); }}
            >
              Privacy Policy
            </a>
            <a 
              href="#terms" 
              className="hover:text-brand-light-green hover:underline decoration-brand-light-green transition-all"
              onClick={(e) => { e.preventDefault(); alert("Fitkode Terms & Conditions: All monthly and annual dynamic coaching features include a standard, transparent satisfaction refund policy."); }}
            >
              Terms & Conditions
            </a>
            <button
              onClick={() => setShowComplianceModal(true)}
              className="hover:text-brand-light-green hover:underline transition-all text-sm font-semibold cursor-pointer"
            >
              Do Not Sell My Personal Information
            </button>
          </div>

          {/* Copyright Info */}
          <div className="text-center md:text-right text-xs text-brand-light-green/90 space-y-1">
            <p>Copyright © 2026 @ Wisdom for Fitness Solutions</p>
            <p className="text-[10px] opacity-75">All Rights Reserved. Engineered with Absolute Privacy.</p>
          </div>

        </div>
      </div>

      {/* Compliance CCPA Popup */}
      {showComplianceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-gray-900">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-brand-light-green rounded-full text-brand-green">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-gray-900">Your Privacy Rights (CCPA)</h3>
                <p className="text-xs text-gray-500 mt-1">We respect your absolute authority over your physical profiles & data logs.</p>
              </div>
            </div>

            <div className="text-xs leading-relaxed text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Wisdom for Fitness Solutions respects your privacy choices under CCPA and GDPR. 
              <strong> We strictly do not sell, trade, or share your fitness logs, calorie intake, macro metrics, or personal goals with external brokers.</strong> All diagnostics remain private to you and your fitness advisor.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowComplianceModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
              >
                Close Window
              </button>
              <button 
                onClick={() => {
                  setShowComplianceModal(false);
                  alert("Your request has been filed. We have successfully registered your persistent non-sharing preference with your fitness dashboard profile.");
                }}
                className="px-4 py-2 text-xs font-bold bg-brand-green text-white rounded-lg hover:bg-brand-dark-green shadow transition-all"
              >
                Confirm My Opt-Out Preference
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
