import React from 'react';
import Seo from './Seo';
import { FileText, Shield, Mail, MapPin, Clock } from 'lucide-react';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Seo 
        title="Terms & Conditions | Fitkode"
        description="Terms governing the use of Fitkode's website and coaching services, compliant with India's DPDPA 2023."
        canonicalPath="/terms"
      />

      <div className="bg-white rounded-3xl border border-brand-light-green p-8 sm:p-12 shadow-sm space-y-8">
        <div className="flex items-center gap-3 border-b border-brand-light-green pb-6">
          <div className="p-3 bg-brand-light-green rounded-full text-brand-green">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark-green">
              Terms &amp; Conditions
            </h1>
            <p className="text-xs text-gray-500">Legal Entity: <strong>Fitkode Studio</strong> &bull; Effective: March 2026</p>
          </div>
        </div>

        {/* Standardized Non-Medical & Coaching Disclaimer */}
        <MedicalDisclaimer variant="card" />

        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>
            Welcome to Fitkode. By accessing our website or enrolling in our nutrition and workout coaching programs, you agree to comply with and be bound by the following Terms and Conditions.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">1. Coaching Services &amp; Consultations</h2>
          <p>
            Fitkode provides educational nutrition guidance, custom workout plans, and lifestyle coaching delivered by INFS-certified consultants. Our coaching is non-medical and is intended for general physical wellness, strength, and body recomposition.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">2. Medical &amp; Clinical Disclaimer</h2>
          <p>
            Clients must consult a qualified physician or medical doctor before commencing any new diet or physical exercise regimen, particularly if managing pre-existing medical conditions, chronic illnesses, or taking prescription medications. Fitkode consultants do not diagnose, treat, cure, or clinically prescribe therapies for medical disorders.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">3. Client Responsibilities &amp; Truthful Disclosures</h2>
          <p>
            Coaching success requires active client participation, accurate progress logs, adherence to safety guidance during exercise execution, and honest reporting of dietary intake and medical limitations. Fitkode is not liable for injuries resulting from inaccurate client disclosures or reckless form deviation.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">4. Intellectual Property</h2>
          <p>
            All custom meal templates, masterclass materials, educational PDFs, and proprietary software tools delivered by Fitkode are the intellectual property of Fitkode and may not be reproduced or redistributed without express written permission.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">5. DPDPA 2023 Compliance &amp; Data Rights</h2>
          <p>
            Fitkode complies with India's Digital Personal Data Protection Act, 2023. You have full self-service rights to access, download, rectify, withdraw health data processing consent, or permanently delete your account and personal metrics at any time via your Client Profile dashboard.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">6. Governing Law &amp; Jurisdiction</h2>
          <p>
            These terms are governed by the laws of India, with legal jurisdiction in Gautam Buddha Nagar / Noida, Uttar Pradesh.
          </p>

          {/* Statutory Grievance Redressal */}
          <div className="mt-8 pt-6 border-t border-brand-light-green">
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
                    Statutory Grievance Redressal under Section 13 of the Digital Personal Data Protection Act (DPDPA 2023)
                  </p>
                </div>
              </div>

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
                  <strong>Turnaround Guarantee:</strong> All legal and privacy grievances are addressed within <strong>72 hours</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
