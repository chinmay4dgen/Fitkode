import React from 'react';
import Seo from './Seo';
import { Shield, Lock, FileCheck, UserCheck, RefreshCw, Trash2, Mail, MapPin, Clock } from 'lucide-react';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Seo
        title="Privacy Policy & DPDPA Compliance | Fitkode"
        description="Fitkode's Privacy Policy, compliant with India's Digital Personal Data Protection Act (DPDPA 2023). Learn about your data rights, consent architecture, and statutory grievance redressal."
        canonicalPath="/privacy-policy"
      />

      <div className="bg-white rounded-3xl border border-brand-light-green p-8 sm:p-12 shadow-sm space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-brand-light-green pb-6">
          <div className="p-3 bg-brand-light-green rounded-full text-brand-green">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark-green">
              Privacy Policy &amp; DPDPA 2023 Compliance
            </h1>
            <p className="text-xs text-gray-500">
              Data Fiduciary: <strong>Fitkode Studio</strong> &bull; Effective: March 2026 &bull; India DPDPA Compliant
            </p>
          </div>
        </div>

        {/* Medical & Coaching Disclaimer */}
        <MedicalDisclaimer variant="callout" />

        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>
            At Fitkode (operating under <strong>Fitkode Studio</strong>), we hold your personal privacy and sensitive health information to the highest standards of confidentiality and security. This policy describes how we collect, process, safeguard, and honor your rights regarding personal and health metrics, designed in strict adherence to <strong>India's Digital Personal Data Protection Act (DPDPA 2023)</strong> and international privacy benchmarks.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-green" />
            1. Consent Architecture &amp; Data Notice
          </h2>
          <p>
            In compliance with Section 6 of the DPDPA 2023, personal and health data collection is based on <strong>explicit, free, specific, informed, and unambiguous consent</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
            <li>
              <strong>Mandatory Intake Consent:</strong> Explicit opt-in is gathered solely for processing physical metrics, dietary records, and lifestyle baselines required to formulate custom nutrition and workout plans.
            </li>
            <li>
              <strong>Optional Communication Consent:</strong> Opt-in for routine coaching notifications and schedule updates via email/WhatsApp is unbundled and strictly voluntary.
            </li>
            <li>
              <strong>No Pre-Ticked Checkboxes:</strong> Consent toggles are unchecked by default, ensuring genuine affirmative client action.
            </li>
          </ul>

          <h2 className="font-display font-bold text-lg text-brand-dark-green flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-brand-green" />
            2. Personal &amp; Health Data We Process
          </h2>
          <p>
            We collect only the minimum necessary data points (Data Minimization principle) needed to deliver evidence-based lifestyle coaching:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
            <li><strong>Identity &amp; Demographics:</strong> Name, email address, phone number, age, gender, city/state, emergency contact.</li>
            <li><strong>Physical Baselines:</strong> Height, body weight, circumference measurements (waist, hips, chest, neck, quads, upper arms), activity level.</li>
            <li><strong>Health &amp; Dietary Disclosures:</strong> Food allergies, digestive indicators, dietary preferences, self-reported injury or medical history.</li>
            <li><strong>Progress Tracking:</strong> Weekly check-in logs, milestone body metrics, and optional progress check-in photos.</li>
          </ul>

          <h2 className="font-display font-bold text-lg text-brand-dark-green flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-green" />
            3. Purpose Limitation &amp; Non-Disclosure
          </h2>
          <p>
            Your metrics are used <strong>exclusively</strong> by Coach Chinmay Jain to tailor your nutrition regimens, strength training schedules, and recovery targets.
          </p>
          <p className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-emerald-950 font-medium">
            <strong>Zero Third-Party Commercial Sale:</strong> Fitkode does NOT sell, rent, monetize, or disclose your personal health metrics to advertisers, insurance underwriters, pharmaceutical corporations, or data brokers.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-brand-green" />
            4. Client Rights Under DPDPA 2023
          </h2>
          <p>
            As a Data Principal under Indian law, you possess enforceable rights that can be exercised directly from your <strong>Profile &gt; Privacy &amp; Data</strong> tab or by contacting our Grievance Officer:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <strong className="block text-gray-900 font-bold mb-1">Right to Access &amp; Portability</strong>
              <p className="text-[11px] text-gray-600">
                Instantly export a complete structured JSON copy of all your metrics, intake questionnaires, and custom workout routines via "Download My Data".
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <strong className="block text-gray-900 font-bold mb-1">Right to Withdraw Consent</strong>
              <p className="text-[11px] text-gray-600">
                You may revoke health data processing consent at any moment. Your account will be marked inactive and coaching processing paused.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
              <strong className="block text-gray-900 font-bold mb-1">Right to Erasure (Deletion)</strong>
              <p className="text-[11px] text-gray-600">
                Execute a self-service purge of all your profile, health questionnaire, tracking history, and custom routines from local and cloud storage.
              </p>
            </div>
          </div>

          <h2 className="font-display font-bold text-lg text-brand-dark-green flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-green" />
            5. Payment Security &amp; Financial Data
          </h2>
          <p>
            All financial transactions are handled via PCIDSS Level 1 compliant payment gateways (Razorpay). Fitkode never stores full debit/credit card credentials or bank account passwords on our systems.
          </p>

          {/* Dedicated DPDPA Statutory Grievance Redressal Section */}
          <div className="mt-8 pt-6 border-t-2 border-brand-light-green">
            <div className="rounded-2xl bg-brand-light-green/30 border-2 border-brand-green/30 p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-brand-green text-white">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-black text-lg text-brand-dark-green">
                    DPDPA Compliance &amp; Data Grievance Redressal
                  </h3>
                  <p className="text-xs text-gray-600">
                    Statutory Grievance Mechanism under Section 13 of the Digital Personal Data Protection Act, 2023
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                If you have any questions, concerns, complaints, or wish to exercise your rights regarding the processing of your personal and health data, you may reach our designated Grievance Officer:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white rounded-xl border border-brand-light-green space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Data Fiduciary</span>
                  <div className="font-bold text-gray-900 text-sm">Fitkode Studio</div>
                  <div className="text-gray-500">Evidence-based Fitness &amp; Nutrition Consultancy</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-brand-light-green space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Designated Grievance Officer</span>
                  <div className="font-bold text-brand-dark-green text-sm">Chinmay Jain</div>
                  <div className="text-gray-500">INFS Certified Nutrition &amp; Fitness Specialist</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-brand-light-green space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-brand-green" />
                    Official Contact Email
                  </span>
                  <a
                    href="mailto:myfitkode@gmail.com"
                    className="font-bold text-brand-green hover:underline text-sm block"
                  >
                    myfitkode@gmail.com
                  </a>
                  <div className="text-gray-500">Phone: +91 98284 02190</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-brand-light-green space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-green" />
                    Physical Address
                  </span>
                  <div className="font-semibold text-gray-800 text-xs leading-relaxed">
                    A1905, Prateek Wisteria Society, Sec-77, Noida-201301 (India)
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-emerald-900 text-xs">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Statutory Resolution Turnaround:</strong> All data grievances and privacy requests are acknowledged and addressed within <strong>72 hours</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
