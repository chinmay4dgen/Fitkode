import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Activity,
  HeartPulse,
  Pill,
  Utensils,
  Dumbbell,
  FileHeart,
  Lock,
} from 'lucide-react';
import { MedicalAssessmentSynopsis } from '../lib/medicalAssessmentHelper';

interface CoachMedicalSynopsisProps {
  synopsis: MedicalAssessmentSynopsis;
  memberName: string;
  context: 'meal' | 'workout';
  isCoachMode: boolean;
}

/**
 * Coach-Only Medical & Allergy Synopsis Component.
 * STRICT PRIVACY REQUIREMENT:
 * This component MUST ONLY render when isCoachMode === true (Super Admin / Coach prescribing for a member).
 * It is completely hidden from the member themselves.
 */
export default function CoachMedicalSynopsis({
  synopsis,
  memberName,
  context,
  isCoachMode,
}: CoachMedicalSynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Guard: NEVER display to the user themselves
  if (!isCoachMode) {
    return null;
  }

  const {
    hasMedicalDisclosures,
    foodAllergies,
    medicationAllergies,
    injuriesAndSurgeries,
    cardioAndVitalsNotes,
    gutAndDigestiveIssues,
    dislikedFoods,
    physicalLimitations,
    currentMedications,
    symptomAlerts,
  } = synopsis;

  // Determine primary highlights according to context
  const primaryAlertsCount =
    context === 'meal'
      ? foodAllergies.length + gutAndDigestiveIssues.length + dislikedFoods.length
      : injuriesAndSurgeries.length + physicalLimitations.length + cardioAndVitalsNotes.length;

  return (
    <div
      id={`coach-medical-synopsis-${context}`}
      className="mb-6 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 p-4 sm:p-5 shadow-xs transition-all"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 border border-amber-400/50 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                Coach Medical &amp; Clinical Synopsis
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                <Lock className="w-2.5 h-2.5 mr-1 text-amber-700" />
                Coach-Only View
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 font-medium">
              Client health intake disclosures for <strong className="text-amber-950">{memberName}</strong>.
              {context === 'meal'
                ? ' Review food allergies, gut sensitivities, and dietary red lines before prescribing meals.'
                : ' Review past surgeries, injuries, limitations, and cardio vitals before prescribing exercise loads.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start sm:self-auto py-1 px-2.5 rounded-lg border border-amber-300 bg-white/80 hover:bg-white text-xs font-bold text-amber-900 flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand Synopsis'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Body Content */}
      {isExpanded && (
        <div className="mt-4 space-y-3.5 text-xs text-amber-950">
          {!hasMedicalDisclosures ? (
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                No adverse medical histories, food allergies, or physical restrictions were declared by {memberName} during onboarding. Standard athletic protocols apply.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* MEAL CONTEXT: Primary block 1: Food Allergies & Intolerances */}
              {context === 'meal' && (
                <div className={`p-3.5 rounded-xl border ${foodAllergies.length > 0 ? 'bg-red-50/90 border-red-200 text-red-950' : 'bg-white/80 border-amber-200 text-amber-900'}`}>
                  <div className="flex items-center space-x-2 font-bold mb-1.5">
                    <Utensils className={`w-3.5 h-3.5 ${foodAllergies.length > 0 ? 'text-red-700' : 'text-amber-700'}`} />
                    <span className="uppercase tracking-wider text-[11px]">
                      Food Allergies &amp; Intolerances
                    </span>
                    {foodAllergies.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-red-200 text-red-800 rounded font-black">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  {foodAllergies.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {foodAllergies.map((a, i) => (
                        <li key={i} className="font-semibold text-red-900">
                          {a}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-[11px]">No food allergies reported.</p>
                  )}
                </div>
              )}

              {/* MEAL CONTEXT: Primary block 2: Gut Health & Digestive Issues */}
              {context === 'meal' && (
                <div className="p-3.5 rounded-xl border bg-white/80 border-amber-200 text-amber-950">
                  <div className="flex items-center space-x-2 font-bold mb-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-amber-700" />
                    <span className="uppercase tracking-wider text-[11px]">
                      Digestive Sensitivities &amp; Gut Symptoms
                    </span>
                  </div>
                  {gutAndDigestiveIssues.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                      {gutAndDigestiveIssues.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-[11px]">No gastrointestinal distress reported.</p>
                  )}
                </div>
              )}

              {/* WORKOUT CONTEXT: Primary block 1: Past Surgeries, Accidents & Injuries */}
              {context === 'workout' && (
                <div className={`p-3.5 rounded-xl border ${injuriesAndSurgeries.length > 0 ? 'bg-red-50/90 border-red-200 text-red-950' : 'bg-white/80 border-amber-200 text-amber-900'}`}>
                  <div className="flex items-center space-x-2 font-bold mb-1.5">
                    <FileHeart className={`w-3.5 h-3.5 ${injuriesAndSurgeries.length > 0 ? 'text-red-700' : 'text-amber-700'}`} />
                    <span className="uppercase tracking-wider text-[11px]">
                      Injuries, Accidents &amp; Surgical History
                    </span>
                    {injuriesAndSurgeries.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-red-200 text-red-800 rounded font-black">
                        EXERCISE RISK
                      </span>
                    )}
                  </div>
                  {injuriesAndSurgeries.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {injuriesAndSurgeries.map((inj, i) => (
                        <li key={i} className="font-semibold text-red-900">
                          {inj}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-[11px]">No prior injuries, operations, or surgical interventions recorded.</p>
                  )}
                </div>
              )}

              {/* WORKOUT CONTEXT: Primary block 2: Physical Limitations & Vitals */}
              {context === 'workout' && (
                <div className="p-3.5 rounded-xl border bg-white/80 border-amber-200 text-amber-950">
                  <div className="flex items-center space-x-2 font-bold mb-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-700" />
                    <span className="uppercase tracking-wider text-[11px]">
                      Physical Limitations &amp; Cardio Vitals
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-amber-900">
                    {physicalLimitations.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-950">Limitations: </span>
                        <span>{physicalLimitations.join(', ')}</span>
                      </div>
                    )}
                    {cardioAndVitalsNotes.length > 0 && (
                      <ul className="list-disc list-inside space-y-1">
                        {cardioAndVitalsNotes.map((v, i) => (
                          <li key={i} className="text-amber-900 font-semibold">{v}</li>
                        ))}
                      </ul>
                    )}
                    {physicalLimitations.length === 0 && cardioAndVitalsNotes.length === 0 && (
                      <p className="text-gray-500 italic text-[11px]">No structural restrictions or elevated BP/cholesterol.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Medications, Antibiotics & Medication Allergies */}
              {(currentMedications.length > 0 || medicationAllergies.length > 0) && (
                <div className="p-3.5 rounded-xl border bg-white/80 border-amber-200 text-amber-950">
                  <div className="flex items-center space-x-2 font-bold mb-1.5">
                    <Pill className="w-3.5 h-3.5 text-amber-700" />
                    <span className="uppercase tracking-wider text-[11px]">
                      Medications &amp; Drug Allergies
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-amber-900">
                    {currentMedications.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-950">Current Rx/Supplements: </span>
                        <span>{currentMedications.join('; ')}</span>
                      </div>
                    )}
                    {medicationAllergies.length > 0 && (
                      <div>
                        <span className="font-bold text-red-900">Drug Allergies: </span>
                        <span className="text-red-800 font-semibold">{medicationAllergies.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Symptoms / Disliked Items / Diet Red Lines */}
              <div className="p-3.5 rounded-xl border bg-white/80 border-amber-200 text-amber-950">
                <div className="flex items-center space-x-2 font-bold mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span className="uppercase tracking-wider text-[11px]">
                    {context === 'meal' ? 'Disliked Foods & Diet Red Lines' : 'Symptom Alerts'}
                  </span>
                </div>
                {context === 'meal' ? (
                  dislikedFoods.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                      {dislikedFoods.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-[11px]">No specific disliked foods noted.</p>
                  )
                ) : (
                  symptomAlerts.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                      {symptomAlerts.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-[11px]">No high-severity dizziness, faintness, or headaches reported.</p>
                  )
                )}
              </div>
            </div>
          )}

          {/* Protective Guidance for Coach */}
          <div className="mt-2 text-[11px] text-amber-800/90 bg-amber-100/60 p-2.5 rounded-lg border border-amber-200/70 flex items-start space-x-2">
            <span className="font-bold text-amber-950">Coach Directive:</span>
            <span>
              {context === 'meal'
                ? 'Ensure no allergic allergens or irritating triggers are incorporated into meal slots or suggested as alternate foods.'
                : 'Avoid prescribing high-impact, shear-stress, or loaded movement patterns across previously injured or surgically reconstructed joints.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
