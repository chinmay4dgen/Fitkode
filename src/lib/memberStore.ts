import { AppMember, UserRole, UserProfile, ClientOnboarding } from '../types';
import { defaultUserProfile, defaultClientOnboarding, getProfileCompletionRate, getOnboardingCompletionRate } from './profileStorage';

export const DEFAULT_ADMIN_EMAILS = ['chinma4jain@gmail.com', 'chinmay4jain@gmail.com'];

export function isDefaultAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return DEFAULT_ADMIN_EMAILS.includes(normalized);
}

// Pre-seeded sample members representing members who have enrolled and logged in to Fitkode
export const SEED_MEMBERS: AppMember[] = [
  {
    id: 'usr_001_priya',
    email: 'priya.sharma@example.com',
    name: 'Priya Sharma',
    role: 'paid',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-08-12T09:30:00Z',
    lastLoginAt: '2026-09-04T18:20:00Z',
    phone: '+91 98201 45678',
    planId: '12-weeks-coaching',
    planName: '12-Week Intensive Coaching',
    planPurchasedAt: '2026-08-12T10:15:00Z',
    profileCompletion: 100,
    onboardingCompletion: 100,
    notes: 'Focus on post-pregnancy core restoration, fat loss, and vegetarian macro targets. Highly dedicated.',
    profile: {
      ...defaultUserProfile,
      email: 'priya.sharma@example.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      dateOfBirth: '1993-04-14',
      age: '33',
      gender: 'Female',
      phone: '+91 98201 45678',
      address: 'B-402, Raheja Towers, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipcode: '400050',
      preferredContact: 'Whatsapp Audio/Video/Message',
      maritalStatus: 'Married',
      children: 'Yes',
      isPregnant: 'No',
      bloodGroup: 'B+',
      livingWith: 'Husband, 3-year-old daughter, in-laws',
      primaryCareProvider: 'Dr. Sunita Kulkarni, Lilavati Hospital',
      lastCheckupDate: '2026-06-20',
    },
    onboarding: {
      ...defaultClientOnboarding,
      foodAllergies: 'None',
      dislikedFoods: 'Eggplant, bitter gourd (karela)',
      whoCooks: 'Maid',
      cookingDifficulty: 'no',
      dietPreferences: ['Vegetarian', 'High Protein'],
      currentSpecificDiet: ['None'],
      mealsEatenRegularly: ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'],
      dailyBeverageOfChoice: ['Green Tea', 'Masala Chai'],
      beverageSnacks: 'Roasted makhana or 2 digestive biscuits',
      beverageFrequencyQuantity: '2 cups of tea daily with 1/2 tsp jaggery',
      breakfastDetails: 'Poha or oats cheela with homemade mint chutney (approx 8:30 AM)',
      lunchDetails: '2 multigrain rotis, 1 katori dal, mixed vegetable subji, bowl of Greek yogurt (1:30 PM)',
      snackDetails: 'Sprouted moong salad or handful of roasted almonds and walnuts (5:30 PM)',
      dinnerDetails: 'Tofu stir fry or paneer bhurji with sauteed vegetables and 1 small phulka (8:30 PM)',
      foodCravings: 'Dark chocolate, baked savory snacks during pre-menstrual cycle',
      cravingFrequency: '1-2 times a week',
      specialDietRestrictions: 'No onion and garlic on Tuesdays (religious)',
      outsideFoodFrequency: 'Once a week',
      outsideFoodItems: 'South Indian dosas or wood-fired thin crust pizza',
      artificialSweeteners: 'Not Applicable',
      heartburnFrequency: 'Rarely',
      gasFrequency: 'Rarely',
      bloatingFrequency: 'Sometimes',
      stomachPainFrequency: 'Never',
      nauseaVomitingFrequency: 'Never',
      diarrheaFrequency: 'Never',
      constipationFrequency: 'Rarely',
      missedDetails: 'Bloating occurs after heavy lentils or chickpea dinners.',
      currentWeightKg: '64.5',
      heightCm: '162',
      waistInches: '30.5',
      hipInches: '38.0',
      neckInches: '13.0',
      chestInches: '35.5',
      upperArmInches: '11.5',
      quadricepsInches: '21.5',
      medicalAndSurgicalHistory: 'C-section delivery in 2023. Fully recovered and cleared by obstetrician for weight training.',
      familyDeathsAndCauses: 'Paternal grandfather passed away at age 82 from natural old age.',
      knowsBloodPressure: 'yes',
      bpAbove14090: 'no',
      knowsCholesterol: 'yes',
      cholesterolAbove200: 'no',
      headachesScore: 1,
      faintnessScore: 1,
      dizzinessScore: 1,
      insomniaScore: 2,
      digestiveIssuesScore: 2,
      emotionalIssuesScore: 2,
      currentMedications: 'Multivitamin & Vitamin D3 60,000 IU monthly',
      medicationAllergies: 'Not applicable',
      completedSections: [1, 2, 3, 4, 5],
      isSubmitted: true,
    },
  },
  {
    id: 'usr_002_rahul',
    email: 'rahul.mehta@example.com',
    name: 'Rahul Mehta',
    role: 'paid',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-07-28T14:10:00Z',
    lastLoginAt: '2026-09-05T08:15:00Z',
    phone: '+91 99304 88712',
    planId: '4-weeks-coaching',
    planName: '4-Week Kickstarter Coaching',
    planPurchasedAt: '2026-07-28T15:00:00Z',
    profileCompletion: 92,
    onboardingCompletion: 100,
    notes: 'Software engineer with sedentary desk hours. Target: 8kg fat loss, build shoulder mobility, stamina.',
    profile: {
      ...defaultUserProfile,
      email: 'rahul.mehta@example.com',
      firstName: 'Rahul',
      lastName: 'Mehta',
      dateOfBirth: '1990-11-05',
      age: '35',
      gender: 'Male',
      phone: '+91 99304 88712',
      address: 'Flat 1004, DLF Cyber City',
      city: 'Gurugram',
      state: 'Haryana',
      zipcode: '122002',
      preferredContact: 'Whatsapp Audio/Video/Message',
      maritalStatus: 'Unmarried',
      children: 'No',
      isPregnant: 'Not applicable',
      bloodGroup: 'O+',
      livingWith: 'Living alone in rented apartment',
      primaryCareProvider: 'Dr. Rajesh Bhardwaj, Max Healthcare',
      lastCheckupDate: '2026-05-10',
    },
    onboarding: {
      ...defaultClientOnboarding,
      foodAllergies: 'Peanuts (mild itching)',
      dislikedFoods: 'Okra (bhindi), raw onions',
      whoCooks: 'Myself',
      cookingDifficulty: 'yes',
      dietPreferences: ['Eggetarian', 'Non-Vegetarian'],
      currentSpecificDiet: ['High Protein'],
      mealsEatenRegularly: ['Lunch', 'Evening Snack', 'Dinner'],
      dailyBeverageOfChoice: ['Black Coffee', 'Whey Protein Shake'],
      beverageSnacks: 'Salted peanuts (avoided now due to allergy), roasted chana',
      beverageFrequencyQuantity: '2 shots of espresso daily without sugar',
      breakfastDetails: 'Frequently skip breakfast due to 16:8 intermittent fasting or take 1 black coffee',
      lunchDetails: '3 boiled eggs, 2 rotis, chicken curry or dal with brown rice (1:00 PM)',
      snackDetails: '1 scoop whey protein in cold water, 1 apple (5:00 PM)',
      dinnerDetails: 'Grilled chicken breast (200g) with stir fried broccoli, carrots, and sweet potato (8:00 PM)',
      foodCravings: 'Late night salty snacks, french fries on weekends',
      cravingFrequency: '3-4 times a week',
      specialDietRestrictions: 'None',
      outsideFoodFrequency: '2-3 times a week',
      outsideFoodItems: 'Subway roasted chicken sandwich, grilled kebabs, Thai green curry',
      artificialSweeteners: 'Stevia in occasional homemade protein desserts',
      heartburnFrequency: 'Sometimes',
      gasFrequency: 'Sometimes',
      bloatingFrequency: 'Rarely',
      stomachPainFrequency: 'Never',
      nauseaVomitingFrequency: 'Never',
      diarrheaFrequency: 'Never',
      constipationFrequency: 'Rarely',
      missedDetails: 'Acidity strikes when dinner is eaten past 10 PM before sleeping.',
      currentWeightKg: '82.4',
      heightCm: '178',
      waistInches: '34.5',
      hipInches: '39.0',
      neckInches: '15.5',
      chestInches: '39.0',
      upperArmInches: '13.5',
      quadricepsInches: '22.0',
      medicalAndSurgicalHistory: 'Mild right lower back stiffness from prolonged desk sitting (L4-L5 postural)',
      familyDeathsAndCauses: 'Maternal grandfather had type 2 diabetes and hypertension.',
      knowsBloodPressure: 'yes',
      bpAbove14090: 'no',
      knowsCholesterol: 'yes',
      cholesterolAbove200: 'no',
      headachesScore: 2,
      faintnessScore: 1,
      dizzinessScore: 1,
      insomniaScore: 3,
      digestiveIssuesScore: 2,
      emotionalIssuesScore: 2,
      currentMedications: 'Fish Oil (Omega-3 1000mg) and Zinc + Magnesium at bedtime',
      medicationAllergies: 'Not applicable',
      completedSections: [1, 2, 3, 4, 5],
      isSubmitted: true,
    },
  },
  {
    id: 'usr_003_ananya',
    email: 'ananya.verma@example.com',
    name: 'Ananya Verma',
    role: 'unpaid',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-09-01T11:00:00Z',
    lastLoginAt: '2026-09-05T09:45:00Z',
    phone: '+91 97112 34567',
    profileCompletion: 85,
    onboardingCompletion: 40,
    notes: 'Registered user exploring coaching plans. Completed profile & dietary intake. Follow up on consultation.',
    profile: {
      ...defaultUserProfile,
      email: 'ananya.verma@example.com',
      firstName: 'Ananya',
      lastName: 'Verma',
      dateOfBirth: '1998-02-18',
      age: '28',
      gender: 'Female',
      phone: '+91 97112 34567',
      address: 'Villa 12, Sobha City, Thanisandra',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipcode: '560077',
      preferredContact: 'Whatsapp Audio/Video/Message',
      maritalStatus: 'Unmarried',
      children: 'No',
      isPregnant: 'No',
      bloodGroup: 'A+',
      livingWith: 'Roommate in 2BHK flat',
      primaryCareProvider: 'Manipal Hospital Family Clinic',
      lastCheckupDate: '2026-03-15',
    },
    onboarding: {
      ...defaultClientOnboarding,
      foodAllergies: 'Lactose intolerance (switched to almond / oat milk)',
      dislikedFoods: 'Mushrooms, raw tomatoes',
      whoCooks: 'Myself',
      cookingDifficulty: 'yes',
      dietPreferences: ['Vegetarian', 'Lactose Free'],
      currentSpecificDiet: ['None'],
      mealsEatenRegularly: ['Breakfast', 'Lunch', 'Dinner'],
      dailyBeverageOfChoice: ['Herbal Infusion', 'Black Coffee'],
      beverageSnacks: 'Makhana, fruit bowl',
      beverageFrequencyQuantity: '1 cup herbal tea, 1 black coffee with stevia',
      breakfastDetails: 'Chia seed pudding with almond milk and blueberries',
      lunchDetails: 'Quinoa bowl with paneer cubes, cucumber, grated carrot, olive oil dressing',
      snackDetails: 'Handful of walnuts',
      dinnerDetails: 'Moong dal soup with stir-fried zucchini and bell peppers',
      foodCravings: 'Ice cream, bakery pastries',
      cravingFrequency: '1-2 times a week',
      specialDietRestrictions: 'Strictly avoid dairy milk and heavy cream',
      outsideFoodFrequency: 'Once a week',
      outsideFoodItems: 'Italian pasta (arrabbiata) or avocado toast',
      artificialSweeteners: 'Stevia drops',
      heartburnFrequency: 'Never',
      gasFrequency: 'Sometimes',
      bloatingFrequency: 'Often',
      stomachPainFrequency: 'Rarely',
      nauseaVomitingFrequency: 'Never',
      diarrheaFrequency: 'Rarely',
      constipationFrequency: 'Rarely',
      missedDetails: 'Experienced bloating after consuming whey concentrate in the past.',
      currentWeightKg: '58.0',
      heightCm: '165',
      waistInches: '28.0',
      hipInches: '36.5',
      neckInches: '12.5',
      chestInches: '34.0',
      upperArmInches: '10.5',
      quadricepsInches: '20.0',
      completedSections: [1, 2],
      isSubmitted: false,
    },
  },
  {
    id: 'usr_004_david',
    email: 'david.miller@example.com',
    name: 'David Miller',
    role: 'unpaid',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-09-03T16:20:00Z',
    lastLoginAt: '2026-09-04T12:00:00Z',
    phone: '+1 (555) 234-5678',
    profileCompletion: 60,
    onboardingCompletion: 0,
    notes: 'Free account created via Google Auth. Browsed the calorie & macro calculator.',
    profile: {
      ...defaultUserProfile,
      email: 'david.miller@example.com',
      firstName: 'David',
      lastName: 'Miller',
      dateOfBirth: '1988-08-22',
      age: '38',
      gender: 'Male',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace',
      city: 'Austin',
      state: 'Texas',
      zipcode: '78701',
      preferredContact: 'Email',
      maritalStatus: 'Married',
      children: 'Yes',
      isPregnant: 'Not applicable',
      bloodGroup: 'O-',
      livingWith: 'Spouse and 2 kids',
      primaryCareProvider: 'Austin Health Center',
      lastCheckupDate: '2025-11-10',
    },
    onboarding: {
      ...defaultClientOnboarding,
      completedSections: [],
      isSubmitted: false,
    },
  },
  {
    id: 'usr_005_vikram',
    email: 'vikram.singh@example.com',
    name: 'Vikram Singh',
    role: 'paid',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-06-15T08:00:00Z',
    lastLoginAt: '2026-09-05T06:30:00Z',
    phone: '+91 98190 12345',
    planId: '24-weeks-coaching',
    planName: '24-Week Lifestyle Transformation',
    planPurchasedAt: '2026-06-15T09:00:00Z',
    profileCompletion: 100,
    onboardingCompletion: 100,
    notes: 'Senior executive. Already down 11 kg in 12 weeks. Maintaining high energy and athletic conditioning.',
    profile: {
      ...defaultUserProfile,
      email: 'vikram.singh@example.com',
      firstName: 'Vikram',
      lastName: 'Singh',
      dateOfBirth: '1982-05-19',
      age: '44',
      gender: 'Male',
      phone: '+91 98190 12345',
      address: 'Penthouse 18, Golf Course Road',
      city: 'Gurugram',
      state: 'Haryana',
      zipcode: '122003',
      preferredContact: 'Whatsapp Audio/Video/Message',
      maritalStatus: 'Married',
      children: 'Yes',
      isPregnant: 'Not applicable',
      bloodGroup: 'A+',
      livingWith: 'Wife, two teenage sons',
      primaryCareProvider: 'Dr. Verma, Medanta The Medicity',
      lastCheckupDate: '2026-07-05',
    },
    onboarding: {
      ...defaultClientOnboarding,
      foodAllergies: 'None',
      dislikedFoods: 'Karela, pumpkin',
      whoCooks: 'Other',
      cookingDifficulty: 'no',
      dietPreferences: ['Non-Vegetarian', 'High Protein'],
      currentSpecificDiet: ['Calorie Deficit / Macro Tracking'],
      mealsEatenRegularly: ['Breakfast', 'Lunch', 'Dinner'],
      dailyBeverageOfChoice: ['Americano', 'Sparkling Water'],
      beverageSnacks: 'Handful of Brazil nuts and almonds',
      beverageFrequencyQuantity: '2 black coffees per day, 3.5L water',
      breakfastDetails: '3 whole eggs scrambled with spinach, 1 slice sourdough toast, avocado (8:00 AM)',
      lunchDetails: 'Grilled salmon or chicken breast (220g), quinoa (100g cooked), asparagus (1:00 PM)',
      snackDetails: 'Whey protein isolate shake with berries (5:00 PM)',
      dinnerDetails: 'Grilled fish tikka or lean steak, large garden salad with vinaigrette (8:00 PM)',
      foodCravings: 'Rare now. Occasional single malt with sparkling water on business dinners.',
      cravingFrequency: '1 or 2 times a month',
      specialDietRestrictions: 'None',
      outsideFoodFrequency: 'Once a week',
      outsideFoodItems: 'Japanese sashimi or Mediterranean grilled meats',
      artificialSweeteners: 'None',
      heartburnFrequency: 'Never',
      gasFrequency: 'Never',
      bloatingFrequency: 'Never',
      stomachPainFrequency: 'Never',
      nauseaVomitingFrequency: 'Never',
      diarrheaFrequency: 'Never',
      constipationFrequency: 'Never',
      missedDetails: 'Digestive regularity has improved drastically with 35g daily dietary fiber.',
      currentWeightKg: '79.2',
      heightCm: '181',
      waistInches: '32.0',
      hipInches: '38.0',
      neckInches: '16.0',
      chestInches: '42.0',
      upperArmInches: '15.0',
      quadricepsInches: '23.5',
      medicalAndSurgicalHistory: 'ACL reconstruction surgery left knee (2018). Completely cleared for squats and deadlifts.',
      familyDeathsAndCauses: 'Father had heart disease in his late 70s.',
      knowsBloodPressure: 'yes',
      bpAbove14090: 'no',
      knowsCholesterol: 'yes',
      cholesterolAbove200: 'no',
      headachesScore: 1,
      faintnessScore: 1,
      dizzinessScore: 1,
      insomniaScore: 1,
      digestiveIssuesScore: 1,
      emotionalIssuesScore: 1,
      currentMedications: 'CoQ10 100mg, Creatine Monohydrate 5g daily, Vitamin D3 + K2',
      medicationAllergies: 'Penicillin (developed mild hives in childhood)',
      completedSections: [1, 2, 3, 4, 5],
      isSubmitted: true,
    },
  },
];

const LOCAL_STORAGE_KEY = 'fitkode_members_registry_v1';

export function getStoredMembers(): AppMember[] {
  if (typeof window === 'undefined') return SEED_MEMBERS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading members from localStorage:', err);
  }
  // Initialize with seed members
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_MEMBERS));
  } catch {
    // ignore
  }
  return SEED_MEMBERS;
}

export function saveStoredMembers(members: AppMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(members));
  } catch (err) {
    console.error('Error saving members to localStorage:', err);
  }
}

/**
 * Resolves the role for a given user email.
 * Defaults chinma4jain@gmail.com and chinmay4jain@gmail.com to 'admin'.
 */
export function determineUserRole(email?: string | null, customRole?: UserRole): UserRole {
  if (!email) return customRole || 'unpaid';
  if (isDefaultAdmin(email)) return 'admin';
  if (customRole) return customRole;

  // Check if this member is stored in the local registry with an explicit role
  const members = getStoredMembers();
  const found = members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());
  if (found) return found.role;

  return 'unpaid';
}

/**
 * Syncs the current logged-in user with the central registry.
 * If user is chinma4jain@gmail.com, ensures role is 'admin'.
 */
export async function syncMemberToStore(memberData: {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: UserRole;
  profile?: UserProfile;
  onboarding?: ClientOnboarding;
  planId?: string;
  planName?: string;
}): Promise<AppMember> {
  const members = getStoredMembers();
  const normalizedEmail = memberData.email.toLowerCase().trim();

  // Determine role: default admin takes precedence
  let resolvedRole: UserRole = 'unpaid';
  if (isDefaultAdmin(normalizedEmail)) {
    resolvedRole = 'admin';
  } else if (memberData.role) {
    resolvedRole = memberData.role;
  }

  const existingIndex = members.findIndex(
    (m) => m.email.toLowerCase() === normalizedEmail || m.id === memberData.id
  );

  const profileRate = memberData.profile ? getProfileCompletionRate(memberData.profile) : 0;
  const onboardingRate = memberData.onboarding ? getOnboardingCompletionRate(memberData.onboarding) : 0;

  let updatedMember: AppMember;

  if (existingIndex >= 0) {
    const existing = members[existingIndex];
    // Don't downgrade admin if already admin
    const finalRole = isDefaultAdmin(normalizedEmail) ? 'admin' : (memberData.role || existing.role || resolvedRole);

    updatedMember = {
      ...existing,
      ...memberData,
      role: finalRole,
      lastLoginAt: new Date().toISOString(),
      profileCompletion: memberData.profile ? profileRate : existing.profileCompletion,
      onboardingCompletion: memberData.onboarding ? onboardingRate : existing.onboardingCompletion,
      profile: memberData.profile || existing.profile,
      onboarding: memberData.onboarding || existing.onboarding,
    };
    members[existingIndex] = updatedMember;
  } else {
    updatedMember = {
      id: memberData.id || `usr_${Date.now()}`,
      email: normalizedEmail,
      name: memberData.name || normalizedEmail.split('@')[0],
      role: resolvedRole,
      avatarUrl: memberData.avatarUrl,
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      phone: memberData.profile?.phone || '',
      planId: memberData.planId,
      planName: memberData.planName,
      profileCompletion: profileRate,
      onboardingCompletion: onboardingRate,
      profile: memberData.profile,
      onboarding: memberData.onboarding,
    };
    members.unshift(updatedMember);
  }

  saveStoredMembers(members);

  // Also sync to backend API asynchronously if server is running
  try {
    fetch('/api/members/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMember),
    }).catch(() => {
      // server sync fallback
    });
  } catch {
    // ignore
  }

  return updatedMember;
}

/**
 * Fetches all members. Super Admin only!
 * If requester is NOT an admin, throws an access denied error.
 */
export async function fetchAllMembersForAdmin(callerEmail?: string | null): Promise<AppMember[]> {
  if (!callerEmail) {
    throw new Error('Unauthorized. You must be signed in.');
  }

  // Determine caller role
  const role = determineUserRole(callerEmail);
  if (role !== 'admin' && !isDefaultAdmin(callerEmail)) {
    throw new Error('Access denied. Only Super Admins can view member data.');
  }

  // Try fetching from server first
  try {
    const res = await fetch(`/api/members?caller=${encodeURIComponent(callerEmail)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.members)) {
        saveStoredMembers(data.members);
        return data.members;
      }
    }
  } catch {
    // Fall back to local storage
  }

  return getStoredMembers();
}

/**
 * Updates a member's role (Super Admin action).
 */
export async function updateMemberRole(
  memberId: string,
  newRole: UserRole,
  callerEmail?: string | null
): Promise<AppMember> {
  const callerRole = determineUserRole(callerEmail);
  if (callerRole !== 'admin' && !isDefaultAdmin(callerEmail)) {
    throw new Error('Access denied. Only Super Admin can change user roles.');
  }

  const members = getStoredMembers();
  const index = members.findIndex((m) => m.id === memberId || m.email.toLowerCase() === memberId.toLowerCase());
  if (index === -1) {
    throw new Error('Member not found.');
  }

  members[index].role = newRole;
  saveStoredMembers(members);

  // Sync to backend
  try {
    await fetch(`/api/members/${encodeURIComponent(memberId)}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole, callerEmail }),
    });
  } catch {
    // ignore
  }

  return members[index];
}

/**
 * Updates internal coach notes for a member.
 */
export function updateMemberNotes(memberId: string, notes: string): void {
  const members = getStoredMembers();
  const index = members.findIndex((m) => m.id === memberId || m.email.toLowerCase() === memberId.toLowerCase());
  if (index >= 0) {
    members[index].notes = notes;
    saveStoredMembers(members);
  }
}
