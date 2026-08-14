import React from 'react';
import Seo from './Seo';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Seo 
        title="Refund Policy & 30-Day Guarantee | Fitkode"
        description="Details of Fitkode's 30-day transparent guarantee and the refund process for coaching plans."
        canonicalPath="/refund-policy"
      />

      <div className="bg-white rounded-3xl border border-brand-light-green p-8 sm:p-12 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-brand-light-green pb-6">
          <div className="p-3 bg-brand-light-green rounded-full text-brand-green">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark-green">
              Refund Policy &amp; 30-Day Guarantee
            </h1>
            <p className="text-xs text-gray-500">Fitkode Transparent Satisfaction Policy</p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p>
            At Fitkode, we stand behind the clinical quality of our nutrition science and workout programming. We want you to feel completely confident investing in your physical transformation.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">1. The 30-Day Transparent Guarantee</h2>
          <p>
            All multi-month comprehensive coaching plans (3 Months, 6 Months, and Annual Longevity Plan) include a 30-day transparent satisfaction policy. If you follow your assigned diet and workout guidance for 30 consecutive days and feel the program is not helping you achieve your fitness baseline, you are eligible for a structured refund review.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">2. Refund Request Process</h2>
          <p>
            To initiate a refund request under the 30-day guarantee:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Send an email to <strong>myfitkode@gmail.com</strong> with the subject line "Refund Request - [Your Name]".</li>
            <li>Include your payment transaction ID or Razorpay receipt number.</li>
            <li>Provide a brief summary of your 30-day coaching log so Coach Chinmay can review your program metrics.</li>
          </ul>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">3. Processing &amp; Timelines</h2>
          <p>
            Once approved, refunds are processed back to the original payment method (Credit Card, Debit Card, NetBanking, or UPI) within 5 to 7 business days as mandated by banking partners.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">4. Non-Refundable Items</h2>
          <p>
            Individual 1-month single consultation plans (Diet &amp; Nutrition Plan, Workout Science Plan) or fully completed coaching tenures beyond the 30-day window are non-refundable once custom meal and workout plans have been delivered.
          </p>

          <h2 className="font-display font-bold text-lg text-brand-dark-green">5. Assistance</h2>
          <p>
            For any billing or refund questions, call direct: <strong>+91 98284 02190</strong> or email <strong>myfitkode@gmail.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
