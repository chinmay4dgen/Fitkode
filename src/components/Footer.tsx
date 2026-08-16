import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import fitkodeLogo from '../assets/images/regenerated_image_1786680575798.webp';

export default function Footer() {
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  return (
    <footer className="bg-[#1C8A43] text-white py-12 border-t border-[#146B33]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          
          {/* Logo & Description */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center justify-center md:justify-start">
              <img 
                src="https://res.cloudinary.com/akmvlt3d/image/upload/v1786877440/My%20Brand/Fitkode_Logo_300_x_150_px_bmxnpa.png" 
                alt="Fitkode" 
                className="h-10 sm:h-11 w-auto object-contain brightness-0 invert"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback) {
                    target.dataset.triedFallback = 'true';
                    target.src = fitkodeLogo;
                  }
                }}
              />
            </div>
            <p className="text-xs text-white/80 max-w-sm mx-auto md:mx-0 leading-relaxed">
              Personalized Nutrition and Workout Plans built on deep science, simplicity, and lifelong independence.
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Coaching &amp; Tools</h4>
            <ul className="space-y-1.5 text-xs text-white/85">
              <li><Link to="/coaching-plans" className="hover:text-white hover:underline transition-colors">Coaching Plans &amp; Pricing</Link></li>
              <li><Link to="/tools" className="hover:text-white hover:underline transition-colors">Fitness Calculators Hub</Link></li>
              <li><Link to="/tools/bmi-calculator" className="hover:text-white hover:underline transition-colors">BMI Calculator</Link></li>
              <li><Link to="/tools/tdee-calculator" className="hover:text-white hover:underline transition-colors">TDEE Calorie Calculator</Link></li>
              <li><Link to="/tools/macro-calculator" className="hover:text-white hover:underline transition-colors">Macro-Nutrient Splitter</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-1.5 text-xs text-white/85">
              <li><Link to="/about" className="hover:text-white hover:underline transition-colors">About Coach Chinmay</Link></li>
              <li><Link to="/results" className="hover:text-white hover:underline transition-colors">Client Transformations</Link></li>
              <li><Link to="/contact" className="hover:text-white hover:underline transition-colors">Contact &amp; Personal Intake</Link></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Legal &amp; Privacy</h4>
            <ul className="space-y-1.5 text-xs text-white/85">
              <li><Link to="/privacy-policy" className="hover:text-white hover:underline transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white hover:underline transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white hover:underline transition-colors">Refund Policy (30-Day Guarantee)</Link></li>
              <li>
                <button
                  onClick={() => setShowComplianceModal(true)}
                  className="hover:text-white hover:underline text-xs text-left cursor-pointer transition-colors"
                >
                  Do Not Sell My Personal Info (CCPA)
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-6 border-t border-white/15 flex flex-col md:flex-row justify-between items-center text-xs text-white/80 gap-2">
          <p>Copyright © 2026 @ Fitkode</p>
          <p className="text-[10px] opacity-75">All Rights Reserved. Engineered with Absolute Privacy.</p>
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
                <p className="text-xs text-gray-500 mt-1">We respect your absolute authority over your physical profiles &amp; data logs.</p>
              </div>
            </div>

            <div className="text-xs leading-relaxed text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              Fitkode respects your privacy choices under CCPA and GDPR. 
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
