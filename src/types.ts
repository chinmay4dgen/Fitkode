export type UserRole = 'admin' | 'paid' | 'unpaid';

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  coverImage: string;
  badge?: string;
  perks: string[];
}

export interface AppMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  joinedAt: string;
  lastLoginAt: string;
  phone?: string;
  planId?: string;
  planName?: string;
  planPurchasedAt?: string;
  profileCompletion: number;
  onboardingCompletion: number;
  profile?: UserProfile;
  onboarding?: ClientOnboarding;
  notes?: string;
  consentStatus?: 'active' | 'withdrawn';
  consentWithdrawnAt?: string;
  weeklyEntries?: WeeklyTrackerEntry[];
}

export type ActivePage = 'home' | 'plans-pricing' | 'fitness-tools' | 'contact-us';

export type ActivityLevel = 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extra-active';

export interface TDEEInput {
  age: number;
  gender: 'male' | 'female';
  weight: number; // in kg
  height: number; // in cm
  activity: ActivityLevel;
}

export interface MacroSplit {
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
}

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  preferredContact: 'Whatsapp Audio/Video/Message' | 'Phone call' | 'Email' | '';
  maritalStatus: 'Married' | 'Unmarried' | '';
  children: 'No' | 'Yes' | 'Not Applicable' | '';
  isPregnant: 'No' | 'Yes' | 'Not applicable' | '';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | "Don't know" | '';
  livingWith: string;
  primaryCareProvider: string;
  lastCheckupDate?: string;
  healthGoal?: 'Weight Loss' | 'Weight Gain' | 'Bodybuilding with Aesthetics' | 'Powerlifting' | 'Sports Specific Performance Enhancement' | 'Others' | '';
  // DPDPA 2023 Consent & Privacy
  healthDataConsent?: boolean;
  healthDataConsentGivenAt?: string;
  notificationsConsent?: boolean;
  notificationsConsentGivenAt?: string;
  isConsentWithdrawn?: boolean;
  consentWithdrawnAt?: string;
  notificationsConsentWithdrawn?: boolean;
  notificationsConsentWithdrawnAt?: string;
  updatedAt?: string;
}

export interface ClientOnboarding {
  // === Goals & Readiness Assessment (Google Form Q5-Q18) ===
  healthGoal: 'Weight Loss' | 'Weight Gain' | 'Bodybuilding with Aesthetics' | 'Powerlifting' | 'Sports Specific Performance Enhancement' | 'Others' | '';
  healthGoalOther?: string;
  coreReasonWhy: string;
  pastDietsAndTechniques: string;
  biggestNutritionChallenges: string;
  desiredHealthHabitChanges: string;
  truthfulnessScale: number; // 1 to 5
  readinessWeeklyTracking: number; // 1 to 5
  readinessModifyDiet: number; // 1 to 5
  readinessSupplements: number; // 1 to 5
  readinessFoodLog: number; // 1 to 5
  readinessModifyLifestyle: number; // 1 to 5
  readinessRelaxationMeditation: number; // 1 to 5
  readinessRegularExercise: number; // 1 to 5
  readinessPeriodicLabTests: number; // 1 to 5

  // === Lifestyle, Physical Activity & Stress Assessment (Google Form Q19-Q38) ===
  currentPhysicalActivities: string[];
  currentPhysicalActivitiesOther?: string;
  physicalActivityDaysPerWeek: string;
  physicalActivityDurationMinutes: string;
  gymAccess: 'yes' | 'no' | 'will prefer homeworkouts' | '';
  workoutDaysAndDuration: string;
  physicalActivityLimitations: string[];
  physicalActivityLimitationsOther?: string;
  stressWork: number; // 1 to 5
  stressFamily: number; // 1 to 5
  stressSocialLife: number; // 1 to 5
  stressFinancial: number; // 1 to 5
  stressHealth: number; // 1 to 5
  stressOther: number; // 1 to 5
  stressOtherDetails?: string;
  unwindRelaxActivities: string;
  sleepHoursWeekdays: string;
  sleepHoursWeekends: string;
  smokingStatus: 'Never' | 'In the past' | 'Regularly' | 'Occasionally' | '';
  cigarettesPerDay: 'Am a non smoker' | '1' | '2-4' | '4-6' | '6+' | '';
  alcoholUse: 'Never' | 'In the past' | 'Regularly' | 'Occasionally' | '';
  alcoholFrequency: 'Never' | 'In the past' | 'Once a Month' | 'Once a Week' | 'Multiple Times a week' | 'Daily' | '';
  alcoholQuantityPerSession: '30 ml' | '60 ml' | '90 ml' | '120 ml' | '120ml +' | 'Not Applicable' | '';

  // === Section: Dietary Preferences & Habits ===
  foodAllergies: string;
  dislikedFoods: string;
  whoCooks: 'Myself' | 'Maid' | 'Spouse' | 'Mother' | 'Other' | '';
  cookingDifficulty: 'yes' | 'no' | '';
  dietPreferences: string[];
  currentSpecificDiet: string[];
  mealsEatenRegularly: string[];
  dailyBeverageOfChoice: string[];
  beverageSnacks: string;
  beverageFrequencyQuantity: string;
  breakfastDetails: string;
  lunchDetails: string;
  snackDetails: string;
  dinnerDetails: string;
  foodCravings: string;
  cravingFrequency: 'Daily' | '1-2 times a week' | '3-4 times a week' | '1 or 2 times a month' | '';
  specialDietRestrictions: string;
  outsideFoodFrequency: 'once a day' | '2-3 times a week' | 'Once a week' | 'Once or twice a month' | '';
  outsideFoodItems: string;
  artificialSweeteners: string;

  // === Section: Digestive & Gut Health ===
  heartburnFrequency: 'Never' | 'Rarely' | 'Often' | 'Sometimes' | '';
  gasFrequency: 'Never' | 'Rarely' | 'Often' | 'Sometimes' | '';
  bloatingFrequency: 'Never' | 'Rarely' | 'Often' | 'Sometimes' | '';
  stomachPainFrequency: 'Never' | 'Rarely' | 'Often' | 'Sometimes' | '';
  nauseaVomitingFrequency: 'Never' | 'Rarely' | 'Often' | 'Sometimes' | '';
  diarrheaFrequency: 'Never' | 'Rarely' | 'Often' | 'Sometimes' | '';
  constipationFrequency: 'Never' | 'Rarely' | 'Often' | 'Sometimes' | '';
  missedDetails: string;

  // === Section: Body Statistics & Measurements ===
  currentWeightKg: string;
  heightCm: string;
  waistInches: string;
  hipInches: string;
  neckInches: string;
  chestInches: string;
  upperArmInches: string;
  quadricepsInches: string;

  // === Section: Past Medical, Surgical & Family History ===
  medicalAndSurgicalHistory: string;
  familyDeathsAndCauses: string;
  knowsBloodPressure: 'yes' | 'no' | '';
  bpAbove14090: 'yes' | 'no' | '';
  knowsCholesterol: 'yes' | 'no' | '';
  cholesterolAbove200: 'yes' | 'no' | '';

  // === Section: Symptom Severity & Medications ===
  headachesScore: number;
  faintnessScore: number;
  dizzinessScore: number;
  insomniaScore: number;
  digestiveIssuesScore: number;
  emotionalIssuesScore: number;
  currentMedications: string;
  medicationAllergies: string;

  completedSections: number[];
  isSubmitted: boolean;
  // DPDPA 2023 Consent & Privacy
  healthDataConsent?: boolean;
  healthDataConsentGivenAt?: string;
  notificationsConsent?: boolean;
  notificationsConsentGivenAt?: string;
  isConsentWithdrawn?: boolean;
  consentWithdrawnAt?: string;
  notificationsConsentWithdrawn?: boolean;
  notificationsConsentWithdrawnAt?: string;
  updatedAt?: string;
}

// === Weekly Health Tracker (Form Questions 1-19) ===
export interface WeeklyTrackerEntry {
  id: string;
  userId: string;
  userEmail: string;
  firstName: string;
  lastName: string;
  checkInDate: string; // YYYY-MM-DD
  weekNumber: number; // e.g. 1, 2, 3...

  // Body Statistics & Daily Activity (Q4-Q11)
  avgStepsPerDay: number; // Q4: Avg. steps per day in last week (7 days)
  weightKg: number; // Q5: Weight in kgs (empty stomach 1st thing in morning)
  waistInches: number; // Q6: Waist in inches
  hipsInches: number; // Q7: Hips in inches
  neckInches: number; // Q8: Neck in inches
  quadsInches: number; // Q9: Quads in inches
  chestInches: number; // Q10: Chest in inches
  upperRightArmInches: number; // Q11: Upper Right arm in inches

  // Workouts & Daily Nutrition (Q12-Q14)
  resistanceWorkoutDays: number; // Q12: Resistance workout days (0-7)
  hiitCardioDays: number; // Q13: HIIT/cardio days (0-7)
  avgCaloriesPerDay: number; // Q14: Avg calories consumed per day

  // Member Progression Photos (Q15-Q18)
  frontPicUrl?: string; // Q15: Front body pic
  leftPicUrl?: string; // Q16: Left profile pic
  rightPicUrl?: string; // Q17: Right profile pic
  backPicUrl?: string; // Q18: Back profile pic

  // Client Reflections & Challenges (Q19)
  challengesFaced: string; // Q19: Any challenges faced in workout or diet or anything?
  coachFeedback?: string; // Internal coach review notes

  createdAt: string;
  updatedAt?: string;
}

// === Meal Planner & Nutrition Types ===
export type DietType = 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian' | 'Keto' | 'Low-Carb' | 'High-Protein Balanced';

export type MeasurementSystem = 'si' | 'count';

export interface MealItem {
  id: string;
  name: string;
  servingSize: string; // e.g. "100g", "2 whole eggs", "1 cup (240ml)"
  calories: number; // kcal
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  category: 'protein' | 'carbs' | 'fats' | 'veggies' | 'dairy' | 'beverage' | 'snack';
  notes?: string;

  // Custom food & quantity-scaled nutrition properties:
  isCustom?: boolean; // true if added by user as custom food, false if from ICMR/FDA/INFS approved master database
  measurementType?: MeasurementSystem; // 'si' (g, ml, kg) or 'count' (units, pieces, eggs, scoops, etc.)
  quantity?: number; // current quantity numeric value, e.g. 2 or 100
  unit?: string; // current unit, e.g. "units", "eggs", "g", "ml", "scoop", "rotis", "pcs"
  unitWeight?: number; // weight in grams or ml per 1 count unit (e.g. 50g for 1 egg, 30g for 1 roti)
  countUnitName?: string; // label for count unit, e.g. "units", "eggs", "rotis", "scoops", "pcs"
  siUnitName?: string; // "g" or "ml"
  baseQuantity?: number; // reference quantity from approved database (e.g. 100 or 2)
  baseUnit?: string; // reference unit from approved database (e.g. "g" or "units")
  baseMeasurementType?: MeasurementSystem;
  baseCalories?: number; // reference calories at baseQuantity
  baseProtein?: number; // reference protein at baseQuantity
  baseCarbs?: number; // reference carbs at baseQuantity
  baseFats?: number; // reference fats at baseQuantity
  baseServingSize?: string; // reference serving string e.g. "100g" or "2 eggs (100g)"
}

export interface MealSlot {
  id: string;
  name: string; // e.g. "Meal 1: Breakfast", "Meal 2: Mid-Morning Snack", "Meal 3: Lunch", "Meal 4: Evening Snack", "Meal 5: Dinner"
  time?: string; // e.g. "08:30 AM"
  items: MealItem[];
}

export interface MealPlan {
  id: string;
  name: string;
  userId: string; // Member email or ID
  userEmail: string;
  targetCalories: number;
  targetProtein: number; // grams
  targetCarbs: number; // grams
  targetFats: number; // grams
  dietType: DietType;
  meals: MealSlot[];
  createdBy: 'coach' | 'user';
  coachName?: string; // e.g. "Chinmay Jain"
  coachNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// === Workout Planner & Exercise Types ===
export type WorkoutGoal = 'Fat Loss & Conditioning' | 'Hypertrophy & Muscle Gain' | 'Strength & Power' | 'General Fitness & Longevity' | 'Athletic Conditioning';
export type WorkoutDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ExerciseItem {
  id: string;
  name: string;
  targetMuscle: string; // e.g. "Chest", "Back", "Quads", "Hamstrings", "Shoulders", "Biceps", "Triceps", "Core", "Cardio"
  sets: number;
  reps: string; // e.g. "8-12", "12-15", "To Failure", "45 sec"
  restSeconds: number; // e.g. 60, 90
  notes?: string;
  videoUrl?: string;
  isCustom?: boolean; // true if added as user custom exercise
  createdBy?: 'coach' | 'user';
}

export interface WorkoutDay {
  id: string;
  dayName: string; // e.g. "Monday - Push (Chest & Shoulders)"
  isRestDay: boolean;
  focus: string; // e.g. "Upper Push Hypertrophy", "Active Recovery"
  exercises: ExerciseItem[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  userId: string; // Member email or ID
  userEmail: string;
  difficulty: WorkoutDifficulty;
  goal: WorkoutGoal;
  daysPerWeek: number;
  days: WorkoutDay[];
  createdBy: 'coach' | 'user';
  coachName?: string; // e.g. "Chinmay Jain"
  coachNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

