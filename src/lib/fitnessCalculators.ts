import { ActivityLevel, BodyFatInput, BodyFatResult } from '../types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  'sedentary': 1.2,
  'lightly-active': 1.375,
  'moderately-active': 1.55,
  'very-active': 1.725,
  'extra-active': 1.9,
};

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, { label: string; detail: string }> = {
  'sedentary': {
    label: 'Sedentary',
    detail: 'Little or no exercise, desk job (1.20x)',
  },
  'lightly-active': {
    label: 'Lightly Active',
    detail: 'Light exercise / sports 1–3 days/week (1.375x)',
  },
  'moderately-active': {
    label: 'Moderately Active',
    detail: 'Moderate exercise / resistance training 3–5 days/week (1.55x)',
  },
  'very-active': {
    label: 'Very Active',
    detail: 'Heavy training / sports 6–7 days/week (1.725x)',
  },
  'extra-active': {
    label: 'Super / Extra Active',
    detail: 'Twice-daily training, heavy physical labor / competitive athlete (1.90x)',
  },
};

/**
 * U.S. Navy Body Fat Formula
 * Reference: Hodgdon & Beckett (1984), Naval Health Research Center.
 * Validated within ±3-4% of DEXA scans across lean, athletic, and overweight body types.
 *
 * NOTE ON UNITS:
 * The classic Navy logarithmic equation coefficients (86.010, 70.041, 36.76 for men;
 * 163.205, 97.684, 78.387 for women) are calibrated strictly for INCHES.
 * If metric centimeters are provided, we convert to inches first before calculating.
 */
export function calculateUSNavyBodyFat(input: BodyFatInput): BodyFatResult {
  const isMetric = input.unit === 'metric';

  // Convert circumference and height to inches for the Navy logarithmic equation
  const toInches = (val: number) => (isMetric ? val / 2.54 : val);
  const toKg = (val: number) => (isMetric ? val : val * 0.45359237);

  const hIn = Math.max(20, toInches(input.height));
  const wIn = Math.max(10, toInches(input.waist));
  const nIn = Math.max(5, toInches(input.neck));
  const hipIn = input.hip ? Math.max(10, toInches(input.hip)) : 0;
  const weightKg = Math.max(20, toKg(input.weight));

  let bf = 0;

  if (input.gender === 'male') {
    // For Men: 86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76
    const diff = Math.max(0.5, wIn - nIn);
    bf = 86.010 * Math.log10(diff) - 70.041 * Math.log10(hIn) + 36.76;
  } else {
    // For Women: 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
    const diff = Math.max(0.5, wIn + hipIn - nIn);
    bf = 163.205 * Math.log10(diff) - 97.684 * Math.log10(hIn) - 78.387;
  }

  // Physiologically bound between 3% and 65%
  const clampedBf = Math.max(3, Math.min(65, Number(bf.toFixed(1))));
  const fatMassKg = Number(((clampedBf / 100) * weightKg).toFixed(1));
  const leanMassKg = Number(Math.max(10, weightKg - fatMassKg).toFixed(1));

  let category = 'Average';
  if (input.gender === 'male') {
    if (clampedBf < 6) category = 'Essential Fat (2-5%)';
    else if (clampedBf <= 13) category = 'Athletes (6-13%)';
    else if (clampedBf <= 17) category = 'Fitness (14-17%)';
    else if (clampedBf <= 24) category = 'Average (18-24%)';
    else category = 'Above Average / Obese (25%+)';
  } else {
    if (clampedBf < 14) category = 'Essential Fat (10-13%)';
    else if (clampedBf <= 20) category = 'Athletes (14-20%)';
    else if (clampedBf <= 24) category = 'Fitness (21-24%)';
    else if (clampedBf <= 31) category = 'Average (25-31%)';
    else category = 'Above Average / Obese (32%+)';
  }

  return {
    bodyFatPercentage: clampedBf,
    fatMassKg,
    leanMassKg,
    category,
  };
}

/**
 * Katch-McArdle BMR Formula
 * Reference: Katch & McArdle (1996), "Essentials of Exercise Physiology"
 * ISSN Position Stand on Body Composition (2018)
 *
 * Formula: BMR = 370 + (21.6 * Lean Body Mass in kg)
 * Lean Body Mass (kg) = Body Weight (kg) * (1 - Body Fat % / 100)
 */
export function calculateKatchMcArdleBMR(weightKg: number, bodyFatPct: number): {
  bmr: number;
  leanMassKg: number;
  fatMassKg: number;
} {
  const clampedBf = Math.max(3, Math.min(65, bodyFatPct));
  const fatMassKg = Number(((clampedBf / 100) * weightKg).toFixed(1));
  const leanMassKg = Number(Math.max(10, weightKg - fatMassKg).toFixed(1));
  const bmr = Math.round(370 + 21.6 * leanMassKg);
  return { bmr, leanMassKg, fatMassKg };
}

/**
 * Mifflin-St Jeor BMR Formula (Fallback when body fat % is unknown)
 * Men: 10 * weight + 6.25 * height - 5 * age + 5
 * Women: 10 * weight + 6.25 * height - 5 * age - 161
 */
export function calculateMifflinStJeorBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): number {
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
}

/**
 * TDEE = BMR * Activity Factor
 */
export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activity] || 1.2;
  return Math.round(bmr * multiplier);
}
