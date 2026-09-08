import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const MEDICAL_DISCLAIMER_TEXT =
  'Fitkode provides evidence-based fitness and lifestyle coaching. Coach Chinmay Jain is an INFS Certified Nutrition & Fitness Specialist and not a licensed medical practitioner. Recommendations do not constitute medical diagnosis, treatment, or clinical prescription. Consult a physician before beginning any new diet or training regimen.';

interface MedicalDisclaimerProps {
  variant?: 'card' | 'footer' | 'compact' | 'callout';
  className?: string;
  showTitle?: boolean;
}

export default function MedicalDisclaimer({
  variant = 'card',
  className = '',
  showTitle = true,
}: MedicalDisclaimerProps) {
  if (variant === 'footer') {
    return (
      <div className={`text-xs leading-relaxed text-white/75 bg-black/15 p-4 rounded-2xl border border-white/10 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-1.5 font-bold text-white/95 text-xs uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Non-Medical Coaching Disclaimer</span>
          </div>
        )}
        <p className="text-[11px] text-white/80 leading-relaxed">
          {MEDICAL_DISCLAIMER_TEXT}
        </p>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed ${className}`}>
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          {showTitle && <span className="font-bold block text-amber-950 mb-0.5">Medical & Coaching Disclaimer:</span>}
          <span className="text-[11px] text-amber-900/90">{MEDICAL_DISCLAIMER_TEXT}</span>
        </div>
      </div>
    );
  }

  if (variant === 'callout') {
    return (
      <div className={`p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs space-y-1.5 leading-relaxed ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Professional Coaching Notice</span>
          </div>
        )}
        <p className="text-[11px] text-emerald-900/90 leading-relaxed">
          {MEDICAL_DISCLAIMER_TEXT}
        </p>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs space-y-1.5 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Non-Medical & Coaching Disclaimer</span>
        </div>
      )}
      <p className="text-[11.5px] text-amber-900/90 leading-relaxed">
        {MEDICAL_DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
