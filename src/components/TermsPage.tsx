import React from 'react';
import Seo from './Seo';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Seo 
        title="Terms & Conditions | Fitkode"
        description="Terms governing the use of Fitkode's website and coaching services."
        canonicalPath="/terms"
      />

      <div className="bg-white rounded-3xl border border-brand-light-green p-8 sm:p-12 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-brand-light-green pb-6">
          <div className="p-3 bg-brand-light-green rounded-full text-brand-green">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark-green">
              Terms &amp; Conditions
            </h1>
            <p className="text-xs text-gray-500">Legal Entity: Fitkode</p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>
            Welcome to Fitkode. By accessing our website or enrolling in our nutrition and workout coaching programs, you agree to comply with and be bound by the following Terms and Conditions.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">1. Coaching Services &amp; Consultations</h2>
          <p>
            Fitkode provides educational nutrition guidance, custom workout plans, and lifestyle coaching delivered by INFS-certified consultants. Our coaching is non-medical and is intended for general physical wellness, strength, and body recomposition.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">2. Medical Disclaimer</h2>
          <p>
            Clients should consult a qualified physician before commencing any new diet or physical exercise regimen, particularly if managing pre-existing medical conditions. Fitkode consultants do not diagnose or treat medical disorders.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">3. Client Responsibilities</h2>
          <p>
            Coaching success requires active client participation, accurate progress logs, adherence to safety guidance during exercise execution, and honest reporting of dietary intake.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">4. Intellectual Property</h2>
          <p>
            All custom meal templates, masterclass materials, educational PDFs, and proprietary software tools delivered by Fitkode are the intellectual property of Fitkode and may not be reproduced or redistributed.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">5. Governing Law</h2>
          <p>
            These terms are governed by the laws of India, with legal jurisdiction in Gautam Buddha Nagar / Noida, Uttar Pradesh.
          </p>
        </div>
      </div>
    </div>
  );
}
