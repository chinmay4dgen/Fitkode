import React from 'react';
import Seo from './Seo';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Seo 
        title="Privacy Policy | Fitkode"
        description="How Fitkode collects, uses and protects your personal and health information."
        canonicalPath="/privacy-policy"
      />

      <div className="bg-white rounded-3xl border border-brand-light-green p-8 sm:p-12 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-brand-light-green pb-6">
          <div className="p-3 bg-brand-light-green rounded-full text-brand-green">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark-green">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-500">Legal Entity: Fitkode</p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>
            At Fitkode, we treat your privacy and personal data with strict confidentiality. This Privacy Policy outlines how we handle information collected when you use our website at <strong>fitkode.com</strong> or participate in our fitness and nutrition coaching programs.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">1. Information We Collect</h2>
          <p>
            We collect personal information necessary to deliver personalized coaching, including your name, email address, phone number, dietary preferences, physical metrics (age, height, weight, activity level), and health goals submitted through our consultation forms.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">2. How We Use Your Data</h2>
          <p>
            Your information is strictly used to construct custom nutrition and workout plans, communicate coaching updates, conduct progress reviews, and process secure billing. We do not sell, rent, trade, or share your fitness logs, dietary habits, or contact records with third-party data brokers.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">3. Payment Security</h2>
          <p>
            All financial transactions are processed securely via PCIDSS-compliant payment gateways (such as Razorpay). Fitkode does not store full credit card or bank account details on our servers.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">4. Data Rights &amp; Opt-Out</h2>
          <p>
            Under CCPA and GDPR guidelines, you retain full ownership of your data. You may request complete deletion or exported copies of your coaching records at any time by contacting <strong>myfitkode@gmail.com</strong>.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">5. Contact Us</h2>
          <p>
            For privacy inquiries or compliance requests, contact: <br />
            <strong>Fitkode</strong> <br />
            A1905, Prateek Wisteria, Sector 77, Noida, UP 201301, India <br />
            Phone: +91 98284 02190 | Email: myfitkode@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
