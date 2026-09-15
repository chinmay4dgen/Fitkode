import { ClientOnboarding, AppMember } from '../types';
import { loadClientOnboarding } from './profileStorage';
import { getStoredMembers } from './memberStore';

export interface MedicalAssessmentSynopsis {
  hasMedicalDisclosures: boolean;
  foodAllergies: string[];
  medicationAllergies: string[];
  injuriesAndSurgeries: string[];
  cardioAndVitalsNotes: string[];
  gutAndDigestiveIssues: string[];
  dislikedFoods: string[];
  physicalLimitations: string[];
  currentMedications: string[];
  symptomAlerts: string[];
  rawFoodAllergyText?: string;
  rawMedicalHistoryText?: string;
}

/**
 * Checks if a string contains actual content rather than "none", "n/a", "no", etc.
 */
function hasValidText(val?: string | null): boolean {
  if (!val) return false;
  const cleaned = val.trim().toLowerCase();
  const negatives = [
    'none',
    'no',
    'na',
    'n/a',
    'not applicable',
    'nil',
    'nothing',
    'none of the above',
    'never',
    'no allergies',
    'no food allergies',
    'no injuries',
  ];
  return cleaned.length > 0 && !negatives.includes(cleaned);
}

/**
 * Parses and extracts a structured clinical & lifestyle synopsis from ClientOnboarding data.
 */
export function extractMedicalSynopsis(onboarding?: ClientOnboarding | null): MedicalAssessmentSynopsis {
  if (!onboarding) {
    return {
      hasMedicalDisclosures: false,
      foodAllergies: [],
      medicationAllergies: [],
      injuriesAndSurgeries: [],
      cardioAndVitalsNotes: [],
      gutAndDigestiveIssues: [],
      dislikedFoods: [],
      physicalLimitations: [],
      currentMedications: [],
      symptomAlerts: [],
    };
  }

  const foodAllergies: string[] = [];
  if (hasValidText(onboarding.foodAllergies)) {
    foodAllergies.push(onboarding.foodAllergies.trim());
  }

  const medicationAllergies: string[] = [];
  if (hasValidText(onboarding.medicationAllergies)) {
    medicationAllergies.push(onboarding.medicationAllergies.trim());
  }

  const injuriesAndSurgeries: string[] = [];
  if (hasValidText(onboarding.medicalAndSurgicalHistory)) {
    injuriesAndSurgeries.push(onboarding.medicalAndSurgicalHistory.trim());
  }

  const physicalLimitations: string[] = [];
  if (Array.isArray(onboarding.physicalActivityLimitations) && onboarding.physicalActivityLimitations.length > 0) {
    onboarding.physicalActivityLimitations.forEach((lim) => {
      if (hasValidText(lim) && lim !== 'None') {
        physicalLimitations.push(lim);
      }
    });
  }
  if (hasValidText(onboarding.physicalActivityLimitationsOther)) {
    physicalLimitations.push(onboarding.physicalActivityLimitationsOther!.trim());
  }

  const cardioAndVitalsNotes: string[] = [];
  if (onboarding.bpAbove14090 === 'yes') {
    cardioAndVitalsNotes.push('Reported Blood Pressure > 140/90 mm Hg (Hypertension Risk)');
  }
  if (onboarding.cholesterolAbove200 === 'yes') {
    cardioAndVitalsNotes.push('Reported Serum Cholesterol > 200 mg/dL (Hyperlipidemia Risk)');
  }

  const gutAndDigestiveIssues: string[] = [];
  if (['Often', 'Sometimes'].includes(onboarding.bloatingFrequency || '')) {
    gutAndDigestiveIssues.push(`Bloating (${onboarding.bloatingFrequency})`);
  }
  if (['Often', 'Sometimes'].includes(onboarding.heartburnFrequency || '')) {
    gutAndDigestiveIssues.push(`Heartburn / Acid Reflux (${onboarding.heartburnFrequency})`);
  }
  if (['Often', 'Sometimes'].includes(onboarding.stomachPainFrequency || '')) {
    gutAndDigestiveIssues.push(`Stomach Pain (${onboarding.stomachPainFrequency})`);
  }
  if (['Often', 'Sometimes'].includes(onboarding.constipationFrequency || '')) {
    gutAndDigestiveIssues.push(`Constipation (${onboarding.constipationFrequency})`);
  }
  if (['Often', 'Sometimes'].includes(onboarding.diarrheaFrequency || '')) {
    gutAndDigestiveIssues.push(`Diarrhea (${onboarding.diarrheaFrequency})`);
  }
  if (hasValidText(onboarding.missedDetails)) {
    gutAndDigestiveIssues.push(onboarding.missedDetails.trim());
  }

  const dislikedFoods: string[] = [];
  if (hasValidText(onboarding.dislikedFoods)) {
    dislikedFoods.push(onboarding.dislikedFoods.trim());
  }
  if (hasValidText(onboarding.specialDietRestrictions)) {
    dislikedFoods.push(`Restriction: ${onboarding.specialDietRestrictions.trim()}`);
  }

  const currentMedications: string[] = [];
  if (hasValidText(onboarding.currentMedications)) {
    currentMedications.push(onboarding.currentMedications.trim());
  }

  const symptomAlerts: string[] = [];
  if ((onboarding.headachesScore ?? 0) >= 3) {
    symptomAlerts.push(`Frequent Headaches (Score ${onboarding.headachesScore}/5)`);
  }
  if ((onboarding.dizzinessScore ?? 0) >= 3) {
    symptomAlerts.push(`Dizziness / Vertigo (Score ${onboarding.dizzinessScore}/5)`);
  }
  if ((onboarding.faintnessScore ?? 0) >= 3) {
    symptomAlerts.push(`Faintness (Score ${onboarding.faintnessScore}/5)`);
  }
  if ((onboarding.insomniaScore ?? 0) >= 4) {
    symptomAlerts.push(`Severe Insomnia (Score ${onboarding.insomniaScore}/5)`);
  }

  const hasMedicalDisclosures =
    foodAllergies.length > 0 ||
    medicationAllergies.length > 0 ||
    injuriesAndSurgeries.length > 0 ||
    cardioAndVitalsNotes.length > 0 ||
    gutAndDigestiveIssues.length > 0 ||
    physicalLimitations.length > 0 ||
    currentMedications.length > 0 ||
    symptomAlerts.length > 0;

  return {
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
    rawFoodAllergyText: onboarding.foodAllergies,
    rawMedicalHistoryText: onboarding.medicalAndSurgicalHistory,
  };
}

/**
 * Resolves onboarding data for a specific member by userEmail or userId.
 * Checks members repository first (admin view), then local profileStorage.
 */
export function getMemberOnboarding(userEmailOrId?: string): ClientOnboarding | null {
  if (!userEmailOrId) return null;
  const norm = userEmailOrId.toLowerCase().trim();

  // Check in-memory/cached members from memberStore
  const members = getStoredMembers();
  const matchedMember = members.find(
    (m) => m.email?.toLowerCase().trim() === norm || m.id?.toLowerCase().trim() === norm
  );

  if (matchedMember?.onboarding) {
    return matchedMember.onboarding;
  }

  // Fallback to local profile storage
  try {
    const local = loadClientOnboarding(userEmailOrId);
    if (local && (local.isSubmitted || local.completedSections?.length > 0 || local.foodAllergies || local.medicalAndSurgicalHistory)) {
      return local;
    }
  } catch {
    // ignore
  }

  return null;
}
