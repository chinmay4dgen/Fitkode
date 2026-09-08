import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  buildWeeklyTrackerEmail,
  buildDietPlanAssignedEmail,
  buildWorkoutPlanAssignedEmail,
  sendEmailNotification,
  getAllCommunicationLogs,
  getMailTransporterConfig,
} from './server/communicationService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization of Razorpay SDK instance
let razorpayClient: Razorpay | null = null;

function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayClient;
}

// Default admin emails configured in system
const DEFAULT_ADMIN_EMAILS = ['chinma4jain@gmail.com', 'chinmay4jain@gmail.com'];

// In-memory member repository with pre-seeded sample data
const serverMembers: any[] = [
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
      foodAllergies: 'Peanuts (mild itching)',
      dislikedFoods: 'Okra (bhindi), raw onions',
      whoCooks: 'Myself',
      cookingDifficulty: 'yes',
      dietPreferences: ['Eggetarian', 'Non-Vegetarian'],
      currentSpecificDiet: ['High Protein'],
      mealsEatenRegularly: ['Lunch', 'Evening Snack', 'Dinner'],
      dailyBeverageOfChoice: ['Black Coffee', 'Whey Protein Shake'],
      beverageSnacks: 'Roasted chana',
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
    notes: 'Senior executive. Down 11 kg in 12 weeks. Maintaining high energy and athletic conditioning.',
    profile: {
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
      foodAllergies: 'None',
      dislikedFoods: 'Karela, pumpkin',
      whoCooks: 'Family Cook / Chef',
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
      foodCravings: 'Rare now. Occasional single malt on business dinners.',
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
      missedDetails: 'Digestive regularity has improved drastically with 35g daily fiber.',
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

function isUserAdmin(email?: string): boolean {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  if (DEFAULT_ADMIN_EMAILS.includes(norm)) return true;
  const member = serverMembers.find((m) => m.email.toLowerCase() === norm);
  return member?.role === 'admin';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://okwqbcmndtrdtnqlijip.supabase.co wss://okwqbcmndtrdtnqlijip.supabase.co https://*.google-analytics.com https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://accounts.google.com https: wss:; img-src 'self' https: data: blob:; font-src 'self' https: data:;"
    );
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Supabase Auth Config status endpoint
  app.get('/api/auth/config', (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const isConfigured = Boolean(
      supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('http')
    );
    res.json({
      supabaseUrl,
      supabaseAnonKey,
      isConfigured,
    });
  });

  // Razorpay Config status endpoint
  app.get('/api/razorpay/config', (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const isConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    res.json({
      keyId,
      isConfigured,
      currency: 'INR'
    });
  });

  // --- MEMBER DIRECTORY & ROLES APIS ---

  // GET /api/members: Admin only! Retrieves all registered members
  app.get('/api/members', (req, res) => {
    const callerEmail = (req.query.caller as string) || (req.headers['x-user-email'] as string) || '';
    
    if (!isUserAdmin(callerEmail)) {
      return res.status(403).json({
        error: 'Forbidden. Access restricted to Fitkode Super Admins.',
        hint: 'Only chinma4jain@gmail.com and authorized admins can view member directory.'
      });
    }

    // Return all members
    return res.json({
      success: true,
      count: serverMembers.length,
      members: serverMembers,
    });
  });

  // GET /api/members/:id: Returns full profile and assessment for a single member
  // Accessible to Admin OR the member themselves
  app.get('/api/members/:id', (req, res) => {
    const { id } = req.params;
    const callerEmail = (req.query.caller as string) || (req.headers['x-user-email'] as string) || '';
    
    const member = serverMembers.find(
      (m) => m.id === id || m.email.toLowerCase() === id.toLowerCase().trim()
    );

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const isAdmin = isUserAdmin(callerEmail);
    const isSelf = callerEmail && member.email.toLowerCase() === callerEmail.toLowerCase().trim();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        error: 'Forbidden. Other members are not permitted to view this information.'
      });
    }

    return res.json({ success: true, member });
  });

  // POST /api/members/sync: Syncs a user profile / login to server
  app.post('/api/members/sync', (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || !incoming.email) {
        return res.status(400).json({ error: 'Email is required for member sync.' });
      }

      const emailKey = incoming.email.toLowerCase().trim();
      const isAdminEmail = DEFAULT_ADMIN_EMAILS.includes(emailKey);
      
      const existingIndex = serverMembers.findIndex(
        (m) => m.email.toLowerCase() === emailKey || m.id === incoming.id
      );

      let finalRole = incoming.role || 'unpaid';
      if (isAdminEmail) {
        finalRole = 'admin';
      }

      if (existingIndex >= 0) {
        const existing = serverMembers[existingIndex];
        serverMembers[existingIndex] = {
          ...existing,
          ...incoming,
          role: isAdminEmail ? 'admin' : (existing.role || finalRole),
          lastLoginAt: new Date().toISOString(),
        };
        return res.json({ success: true, member: serverMembers[existingIndex] });
      } else {
        const newMember = {
          id: incoming.id || `usr_${Date.now()}`,
          email: emailKey,
          name: incoming.name || emailKey.split('@')[0],
          role: isAdminEmail ? 'admin' : finalRole,
          avatarUrl: incoming.avatarUrl,
          joinedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          phone: incoming.phone || '',
          planId: incoming.planId,
          planName: incoming.planName,
          profileCompletion: incoming.profileCompletion || 0,
          onboardingCompletion: incoming.onboardingCompletion || 0,
          profile: incoming.profile,
          onboarding: incoming.onboarding,
          notes: incoming.notes || '',
        };
        serverMembers.unshift(newMember);
        return res.json({ success: true, member: newMember });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Error syncing member' });
    }
  });

  // PATCH /api/members/:id/role: Super Admin action to update a member's role
  app.patch('/api/members/:id/role', (req, res) => {
    const { id } = req.params;
    const { role, callerEmail } = req.body;

    if (!isUserAdmin(callerEmail)) {
      return res.status(403).json({ error: 'Forbidden. Only Super Admin can modify user roles.' });
    }

    if (!['admin', 'paid', 'unpaid'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Allowed roles are: admin, paid, unpaid.' });
    }

    const memberIndex = serverMembers.findIndex(
      (m) => m.id === id || m.email.toLowerCase() === id.toLowerCase().trim()
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    serverMembers[memberIndex].role = role;
    return res.json({ success: true, member: serverMembers[memberIndex] });
  });

  // =========================================================================
  // WEEKLY HEALTH TRACKER ENDPOINTS (Strict Privacy & Admin Visibility)
  // =========================================================================
  const serverWeeklyEntries: any[] = [
    // Pre-seeded Priya Sharma weekly entries
    {
      id: 'chk_priya_w1',
      userId: 'usr_001_priya',
      userEmail: 'priya.sharma@example.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      checkInDate: '2026-08-15',
      weekNumber: 1,
      avgStepsPerDay: 8200,
      weightKg: 67.2,
      waistInches: 32.5,
      hipsInches: 40.0,
      neckInches: 13.5,
      quadsInches: 22.5,
      chestInches: 36.5,
      upperRightArmInches: 12.0,
      resistanceWorkoutDays: 3,
      hiitCardioDays: 2,
      avgCaloriesPerDay: 1950,
      frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
      leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
      rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
      backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
      challengesFaced: 'Getting back into a rhythm post-partum was tough the first 3 days. Struggled with evening hunger around 6 PM.',
      coachFeedback: 'Great baseline kickoff Priya! Adjusted your evening snack to sprouted moong chaat with cucumber for higher satiety.',
      createdAt: '2026-08-15T09:00:00Z',
    },
    {
      id: 'chk_priya_w2',
      userId: 'usr_001_priya',
      userEmail: 'priya.sharma@example.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      checkInDate: '2026-08-22',
      weekNumber: 2,
      avgStepsPerDay: 9100,
      weightKg: 66.3,
      waistInches: 31.8,
      hipsInches: 39.5,
      neckInches: 13.2,
      quadsInches: 22.2,
      chestInches: 36.2,
      upperRightArmInches: 11.8,
      resistanceWorkoutDays: 4,
      hiitCardioDays: 2,
      avgCaloriesPerDay: 1850,
      frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
      leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
      rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
      backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
      challengesFaced: 'Had a family dinner on Thursday, but managed to stick to grilled paneer and salad. Energy was much better!',
      coachFeedback: 'Solid discipline at the family dinner! Down 0.9kg and 0.7 inches off the waist already. Keep hydrating.',
      createdAt: '2026-08-22T08:30:00Z',
    },
    {
      id: 'chk_priya_w3',
      userId: 'usr_001_priya',
      userEmail: 'priya.sharma@example.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      checkInDate: '2026-08-29',
      weekNumber: 3,
      avgStepsPerDay: 9800,
      weightKg: 65.4,
      waistInches: 31.0,
      hipsInches: 38.8,
      neckInches: 13.0,
      quadsInches: 21.8,
      chestInches: 35.8,
      upperRightArmInches: 11.6,
      resistanceWorkoutDays: 4,
      hiitCardioDays: 3,
      avgCaloriesPerDay: 1800,
      frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
      leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
      rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
      backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
      challengesFaced: 'Felt slight soreness in hamstrings on Wednesday after Romanian Deadlifts, but rested adequately.',
      coachFeedback: 'Hamstring soreness is normal adaptation. Make sure to do the post-workout dynamic hip stretches.',
      createdAt: '2026-08-29T08:45:00Z',
    },
    {
      id: 'chk_priya_w4',
      userId: 'usr_001_priya',
      userEmail: 'priya.sharma@example.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      checkInDate: '2026-09-05',
      weekNumber: 4,
      avgStepsPerDay: 10400,
      weightKg: 64.5,
      waistInches: 30.5,
      hipsInches: 38.0,
      neckInches: 13.0,
      quadsInches: 21.5,
      chestInches: 35.5,
      upperRightArmInches: 11.5,
      resistanceWorkoutDays: 4,
      hiitCardioDays: 3,
      avgCaloriesPerDay: 1780,
      frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
      leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
      rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
      backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
      challengesFaced: 'No major hurdles! Clothes feel significantly looser around waist and hips. Loving the daily consistency.',
      coachFeedback: 'Milestone achievement! -2.7 kg and -2 full inches off the waist in 1 month. Maintaining protocol for Month 2.',
      createdAt: '2026-09-05T09:15:00Z',
    },
    // Pre-seeded Rahul Mehta weekly entries
    {
      id: 'chk_rahul_w1',
      userId: 'usr_002_rahul',
      userEmail: 'rahul.mehta@example.com',
      firstName: 'Rahul',
      lastName: 'Mehta',
      checkInDate: '2026-08-20',
      weekNumber: 1,
      avgStepsPerDay: 6200,
      weightKg: 84.8,
      waistInches: 36.0,
      hipsInches: 40.5,
      neckInches: 16.0,
      quadsInches: 22.8,
      chestInches: 39.8,
      upperRightArmInches: 13.8,
      resistanceWorkoutDays: 3,
      hiitCardioDays: 1,
      avgCaloriesPerDay: 2400,
      frontPicUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
      leftPicUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
      rightPicUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
      backPicUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
      challengesFaced: 'Sedentary desk job made hitting 6k steps tough during conference calls.',
      coachFeedback: 'Let us introduce 10-minute post-meal brisk walks to push your daily step baseline up to 8,000.',
      createdAt: '2026-08-20T10:00:00Z',
    },
    {
      id: 'chk_rahul_w2',
      userId: 'usr_002_rahul',
      userEmail: 'rahul.mehta@example.com',
      firstName: 'Rahul',
      lastName: 'Mehta',
      checkInDate: '2026-08-27',
      weekNumber: 2,
      avgStepsPerDay: 7900,
      weightKg: 83.5,
      waistInches: 35.2,
      hipsInches: 39.8,
      neckInches: 15.8,
      quadsInches: 22.4,
      chestInches: 39.4,
      upperRightArmInches: 13.6,
      resistanceWorkoutDays: 4,
      hiitCardioDays: 2,
      avgCaloriesPerDay: 2200,
      frontPicUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
      leftPicUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
      rightPicUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
      backPicUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
      challengesFaced: 'Slept late on Tuesday due to production sprint. Drank extra black coffee.',
      coachFeedback: 'Prioritize turning off screens 45 mins before bedtime to keep cortisol and visceral fat retention low.',
      createdAt: '2026-08-27T09:30:00Z',
    },
    {
      id: 'chk_rahul_w3',
      userId: 'usr_002_rahul',
      userEmail: 'rahul.mehta@example.com',
      firstName: 'Rahul',
      lastName: 'Mehta',
      checkInDate: '2026-09-04',
      weekNumber: 3,
      avgStepsPerDay: 8600,
      weightKg: 82.4,
      waistInches: 34.5,
      hipsInches: 39.0,
      neckInches: 15.5,
      quadsInches: 22.0,
      chestInches: 39.0,
      upperRightArmInches: 13.5,
      resistanceWorkoutDays: 4,
      hiitCardioDays: 2,
      avgCaloriesPerDay: 2150,
      frontPicUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
      leftPicUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
      rightPicUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
      backPicUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
      challengesFaced: 'Cardio feeling easier. Lower back stiffness has significantly reduced with the core workouts.',
      coachFeedback: 'Down 2.4kg in 3 weeks and waist has reduced 1.5 inches. Perfect steady trajectory Rahul!',
      createdAt: '2026-09-04T08:15:00Z',
    },
  ];

  // GET /api/weekly-tracker: Returns check-ins for a specific user
  // STRICT PRIVACY: Caller can ONLY fetch their own records, unless caller is Super Admin Chinmay!
  app.get('/api/weekly-tracker', (req, res) => {
    const userEmail = (req.query.userEmail as string || '').toLowerCase().trim();
    const callerEmail = (req.query.callerEmail as string || '').toLowerCase().trim();

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail parameter is required.' });
    }

    const isSelf = callerEmail === userEmail;
    const isAdmin = isUserAdmin(callerEmail);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Privacy violation. You are not authorized to view another member’s weekly check-ins.',
      });
    }

    const userEntries = serverWeeklyEntries
      .filter((e) => e.userEmail.toLowerCase().trim() === userEmail)
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

    return res.json({ success: true, entries: userEntries });
  });

  // GET /api/weekly-tracker/all: Returns all check-ins across all members
  // STRICT PRIVACY: Super Admin Chinmay ONLY!
  app.get('/api/weekly-tracker/all', (req, res) => {
    const callerEmail = (req.query.callerEmail as string || '').toLowerCase().trim();

    if (!isUserAdmin(callerEmail)) {
      return res.status(403).json({
        error: 'Forbidden: Only Super Admin Chinmay can inspect all members’ weekly health statistics and photos.',
      });
    }

    const entriesByEmail: Record<string, any[]> = {};
    serverWeeklyEntries.forEach((entry) => {
      const email = entry.userEmail.toLowerCase().trim();
      if (!entriesByEmail[email]) entriesByEmail[email] = [];
      entriesByEmail[email].push(entry);
    });

    // Sort each array
    Object.keys(entriesByEmail).forEach((email) => {
      entriesByEmail[email].sort(
        (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
      );
    });

    return res.json({ success: true, entriesByEmail, totalEntries: serverWeeklyEntries.length });
  });

  // POST /api/weekly-tracker: Add or update a weekly check-in
  app.post('/api/weekly-tracker', (req, res) => {
    const { entry, callerEmail } = req.body;

    if (!entry || !entry.userEmail) {
      return res.status(400).json({ error: 'Valid weekly entry with userEmail is required.' });
    }

    const entryEmail = entry.userEmail.toLowerCase().trim();
    const caller = (callerEmail || '').toLowerCase().trim();

    const isSelf = caller === entryEmail;
    const isAdmin = isUserAdmin(caller);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: You cannot submit or modify weekly statistics for another member.',
      });
    }

    const existingIndex = serverWeeklyEntries.findIndex((e) => e.id === entry.id);
    const sanitizedEntry = {
      ...entry,
      userEmail: entryEmail,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      serverWeeklyEntries[existingIndex] = sanitizedEntry;
    } else {
      serverWeeklyEntries.unshift(sanitizedEntry);
    }

    // Automatically notify Coach Chinmay at myfitkode@gmail.com upon weekly tracker submission
    try {
      const member = serverMembers.find((m) => m.email.toLowerCase().trim() === entryEmail);
      const clientName = member?.name || `${sanitizedEntry.firstName || ''} ${sanitizedEntry.lastName || ''}`.trim() || entryEmail;
      const appUrl = process.env.APP_URL || (req.headers.origin as string) || `http://${req.headers.host}`;
      const emailContent = buildWeeklyTrackerEmail({
        entry: sanitizedEntry,
        clientName,
        appUrl,
      });

      const coachNotificationEmail = process.env.COACH_NOTIFICATION_EMAIL || 'myfitkode@gmail.com';

      sendEmailNotification({
        type: 'weekly_tracker_submission',
        to: coachNotificationEmail,
        subject: emailContent.subject,
        previewText: emailContent.previewText,
        html: emailContent.html,
        text: emailContent.text,
        recipientName: 'Coach Chinmay',
        metadata: {
          clientEmail: entryEmail,
          clientName,
          weekNumber: sanitizedEntry.weekNumber,
          weightKg: sanitizedEntry.weightKg,
        },
      }).catch((err) => {
        console.error('Error dispatching weekly tracker email notification:', err);
      });
    } catch (notifyErr) {
      console.error('Failed to prepare weekly tracker notification:', notifyErr);
    }

    return res.json({ success: true, entry: sanitizedEntry });
  });

  // DELETE /api/weekly-tracker/:id: Delete a check-in
  app.delete('/api/weekly-tracker/:id', (req, res) => {
    const { id } = req.params;
    const caller = (req.query.callerEmail as string || '').toLowerCase().trim();
    const userEmail = (req.query.userEmail as string || '').toLowerCase().trim();

    const isSelf = caller === userEmail;
    const isAdmin = isUserAdmin(caller);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Unauthorized delete request.' });
    }

    const index = serverWeeklyEntries.findIndex((e) => e.id === id);
    if (index >= 0) {
      serverWeeklyEntries.splice(index, 1);
    }

    return res.json({ success: true, message: 'Check-in deleted.' });
  });

  // =========================================================================
  // COMMUNICATION & EMAIL NOTIFICATION ENDPOINTS
  // =========================================================================

  // POST /api/communication/notify-weekly-tracker
  // Dispatches notification to Coach Chinmay (myfitkode@gmail.com)
  app.post('/api/communication/notify-weekly-tracker', async (req, res) => {
    try {
      const { entry, clientName } = req.body;
      if (!entry || !entry.userEmail) {
        return res.status(400).json({ error: 'Weekly entry with userEmail is required.' });
      }

      const userEmail = entry.userEmail.toLowerCase().trim();
      const member = serverMembers.find((m) => m.email.toLowerCase().trim() === userEmail);
      const name = clientName || member?.name || `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || userEmail;
      const appUrl = process.env.APP_URL || (req.headers.origin as string) || `http://${req.headers.host}`;

      const { subject, html, text, previewText } = buildWeeklyTrackerEmail({
        entry,
        clientName: name,
        appUrl,
      });

      const coachNotificationEmail = process.env.COACH_NOTIFICATION_EMAIL || 'myfitkode@gmail.com';

      const result = await sendEmailNotification({
        type: 'weekly_tracker_submission',
        to: coachNotificationEmail,
        subject,
        previewText,
        html,
        text,
        recipientName: 'Coach Chinmay',
        metadata: {
          clientEmail: userEmail,
          clientName: name,
          weekNumber: entry.weekNumber,
          weightKg: entry.weightKg,
        },
      });

      return res.json({ success: true, log: result.log });
    } catch (err: any) {
      console.error('Error in notify-weekly-tracker endpoint:', err);
      return res.status(500).json({ error: err?.message || 'Failed to dispatch notification' });
    }
  });

  // POST /api/communication/notify-plan-assigned
  // Dispatches notification to Client when a Diet Plan or Workout Plan is assigned by Coach
  app.post('/api/communication/notify-plan-assigned', async (req, res) => {
    try {
      const { type, targetEmail, clientName, plan, coachName = 'Chinmay Jain' } = req.body;

      if (!targetEmail || !plan) {
        return res.status(400).json({ error: 'targetEmail and plan are required.' });
      }

      const normTarget = targetEmail.toLowerCase().trim();
      const member = serverMembers.find((m) => m.email.toLowerCase().trim() === normTarget);
      const name = clientName || member?.name || normTarget.split('@')[0];
      const appUrl = process.env.APP_URL || (req.headers.origin as string) || `http://${req.headers.host}`;

      let emailData;
      if (type === 'workout') {
        emailData = buildWorkoutPlanAssignedEmail({
          targetEmail: normTarget,
          clientName: name,
          plan,
          coachName,
          appUrl,
        });
      } else {
        emailData = buildDietPlanAssignedEmail({
          targetEmail: normTarget,
          clientName: name,
          plan,
          coachName,
          appUrl,
        });
      }

      const result = await sendEmailNotification({
        type: type === 'workout' ? 'workout_plan_assigned' : 'diet_plan_assigned',
        to: normTarget,
        subject: emailData.subject,
        previewText: emailData.previewText,
        html: emailData.html,
        text: emailData.text,
        recipientName: name,
        metadata: {
          planId: plan.id,
          planName: plan.name,
          planType: type,
          coachName,
        },
      });

      return res.json({ success: true, log: result.log });
    } catch (err: any) {
      console.error('Error in notify-plan-assigned endpoint:', err);
      return res.status(500).json({ error: err?.message || 'Failed to dispatch plan notification' });
    }
  });

  // GET /api/communication/logs
  // Returns communication logs (Super Admin Chinmay only)
  app.get('/api/communication/logs', (req, res) => {
    const caller = (req.query.callerEmail as string || '').toLowerCase().trim();
    if (!isUserAdmin(caller)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required to inspect communication logs.' });
    }

    const logs = getAllCommunicationLogs();
    return res.json({ success: true, logs });
  });

  // GET /api/communication/config
  // Returns communication transporter configuration status
  app.get('/api/communication/config', (req, res) => {
    const caller = (req.query.callerEmail as string || '').toLowerCase().trim();
    if (!isUserAdmin(caller)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    const config = getMailTransporterConfig();
    return res.json({ success: true, config });
  });

  // POST /api/communication/send-test
  // Dispatches a test verification email
  app.post('/api/communication/send-test', async (req, res) => {
    try {
      const { targetEmail, callerEmail } = req.body;
      const caller = (callerEmail || '').toLowerCase().trim();
      if (!isUserAdmin(caller)) {
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
      }

      const to = (targetEmail || process.env.COACH_NOTIFICATION_EMAIL || 'myfitkode@gmail.com').toLowerCase().trim();
      const appUrl = process.env.APP_URL || (req.headers.origin as string) || `http://${req.headers.host}`;

      const subject = `[Fitkode Test Email] Communication System Verification`;
      const previewText = `Test email sent from Fitkode coaching platform. Communication pipeline is operational.`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 28px; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
          <div style="background: #047857; color: #ffffff; padding: 12px 18px; border-radius: 10px; font-weight: bold; font-size: 16px; margin-bottom: 16px;">
            Fitkode Communication Module
          </div>
          <h2 style="color: #064e3b; margin: 0 0 10px 0; font-size: 18px;">Email System Verification</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">This confirms that your Fitkode notification pipeline is active and dispatching emails.</p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 8px; font-size: 12px; color: #065f46; margin: 16px 0;">
            <strong>Coach Email:</strong> ${process.env.COACH_NOTIFICATION_EMAIL || 'myfitkode@gmail.com'}<br>
            <strong>Triggered at:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </div>
          <p style="font-size: 12px; color: #6b7280;">Fitkode Coaching Platform • <a href="${appUrl}" style="color: #047857;">Open Platform</a></p>
        </div>
      `;
      const text = `Fitkode Communication System Verification\nTest notification sent to ${to} at ${new Date().toISOString()}`;

      const result = await sendEmailNotification({
        type: 'test',
        to,
        subject,
        previewText,
        html,
        text,
        recipientName: 'Coach Chinmay',
        metadata: { isTest: true },
      });

      return res.json({ success: true, log: result.log });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to send test email' });
    }
  });

  // Create Razorpay Order endpoint
  app.post('/api/razorpay/create-order', async (req, res) => {
    try {
      const { planId, planName, amount, customerInfo } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid plan amount specified.' });
      }

      const rzp = getRazorpay();
      if (!rzp) {
        return res.status(503).json({
          error: 'Razorpay keys not configured on server.',
          hint: 'Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Settings > Secrets or .env'
        });
      }

      const amountInPaise = Math.round(Number(amount) * 100);
      const receiptId = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          planId: planId || '',
          planName: planName || '',
          customerName: customerInfo?.name || '',
          customerEmail: customerInfo?.email || '',
          customerPhone: customerInfo?.phone || '',
        }
      });

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    } catch (err: any) {
      console.error('Error creating Razorpay order:', err);
      return res.status(500).json({
        error: err.message || 'Failed to create Razorpay order',
        details: err
      });
    }
  });

  // Verify Razorpay Payment Signature endpoint
  app.post('/api/razorpay/verify-payment', (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, customerInfo } = req.body;

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return res.status(503).json({
          error: 'RAZORPAY_KEY_SECRET is not configured on server.'
        });
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          error: 'Missing payment signature verification parameters.'
        });
      }

      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        console.log(`[Payment Verified] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}, Customer: ${customerInfo?.email || 'N/A'}`);
        
        // If customer email was provided, upgrade customer to 'paid' in server registry
        if (customerInfo?.email) {
          const emailKey = customerInfo.email.toLowerCase().trim();
          const memberIndex = serverMembers.findIndex(m => m.email.toLowerCase() === emailKey);
          if (memberIndex >= 0) {
            serverMembers[memberIndex].role = serverMembers[memberIndex].role === 'admin' ? 'admin' : 'paid';
            serverMembers[memberIndex].planName = planName;
            serverMembers[memberIndex].planPurchasedAt = new Date().toISOString();
          } else {
            serverMembers.unshift({
              id: `usr_pay_${Date.now()}`,
              email: emailKey,
              name: customerInfo.name || emailKey.split('@')[0],
              role: 'paid',
              joinedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              phone: customerInfo.phone || '',
              planName,
              planPurchasedAt: new Date().toISOString(),
              profileCompletion: 30,
              onboardingCompletion: 0,
            });
          }
        }

        return res.json({
          success: true,
          message: 'Payment verified successfully',
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          planName
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid signature. Payment verification failed.'
        });
      }
    } catch (err: any) {
      console.error('Error verifying payment signature:', err);
      return res.status(500).json({
        error: err.message || 'Internal error verifying payment'
      });
    }
  });

  // Vite development middleware or production static asset server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
