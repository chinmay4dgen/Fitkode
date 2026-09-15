import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  buildWeeklyTrackerEmail,
  buildDietPlanAssignedEmail,
  buildWorkoutPlanAssignedEmail,
  buildWelcomeEmail,
  sendEmailNotification,
  getAllCommunicationLogs,
  getMailTransporterConfig,
} from './server/communicationService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization of GoogleGenAI SDK instance
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Resilient helper to query Gemini with automatic model fallback and transient retry
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  requestParams: { contents: any; config?: any },
  models: string[] = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash']
) {
  let lastError: any = null;
  for (const model of models) {
    // Attempt up to 2 times per model if a transient high-demand 503 or 429 occurs
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: requestParams.contents,
          config: requestParams.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = (err.message || '').toLowerCase();
        console.warn(`[Gemini API] Model ${model} (attempt ${attempt + 1}) encountered error:`, err.message || err);
        if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('unavailable') || errMsg.includes('429')) {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
        }
        // If non-transient or on 2nd attempt, advance to next fallback model
        break;
      }
    }
  }
  throw lastError || new Error('Failed to generate content with Gemini after attempting all fallback models.');
}

// Deterministic Nutrition Engine Fallback (guarantees coach workflow even if Gemini is in high-demand spike)
function generateDeterministicFallbackMealPlan(profile: any, targets: any) {
  const isVeg = (profile?.dietaryRestrictions || []).some((r: string) => /veg|jain/i.test(r)) && !(profile?.dietaryRestrictions || []).some((r: string) => /non/i.test(r));
  const isJain = (profile?.dietaryRestrictions || []).some((r: string) => /jain/i.test(r));
  const isVegan = (profile?.dietaryRestrictions || []).some((r: string) => /vegan/i.test(r));
  const isEgg = (profile?.dietaryRestrictions || []).some((r: string) => /egg/i.test(r));

  const mealAllocations = Array.isArray(targets?.mealAllocations) && targets.mealAllocations.length > 0
    ? targets.mealAllocations
    : [
        { mealName: 'Breakfast', targetTime: '08:30 AM', calorieShare: 0.25, targetCalories: Math.round(targets.calorieTarget * 0.25), targetProteinG: Math.round(targets.proteinG * 0.25), targetCarbsG: Math.round(targets.carbsG * 0.25), targetFatsG: Math.round(targets.fatsG * 0.25) },
        { mealName: 'Lunch', targetTime: '01:30 PM', calorieShare: 0.35, targetCalories: Math.round(targets.calorieTarget * 0.35), targetProteinG: Math.round(targets.proteinG * 0.35), targetCarbsG: Math.round(targets.carbsG * 0.35), targetFatsG: Math.round(targets.fatsG * 0.35) },
        { mealName: 'Evening Snack', targetTime: '05:30 PM', calorieShare: 0.10, targetCalories: Math.round(targets.calorieTarget * 0.10), targetProteinG: Math.round(targets.proteinG * 0.10), targetCarbsG: Math.round(targets.carbsG * 0.10), targetFatsG: Math.round(targets.fatsG * 0.10) },
        { mealName: 'Dinner', targetTime: '08:30 PM', calorieShare: 0.30, targetCalories: Math.round(targets.calorieTarget * 0.30), targetProteinG: Math.round(targets.proteinG * 0.30), targetCarbsG: Math.round(targets.carbsG * 0.30), targetFatsG: Math.round(targets.fatsG * 0.30) },
      ];

  const meals = mealAllocations.map((slot: any) => {
    let items: any[] = [];
    let suggestedRecipe = '';
    let recipeNotes = '';
    const cal = slot.targetCalories;
    const p = slot.targetProteinG;
    const c = slot.targetCarbsG;
    const f = slot.targetFatsG;

    if (slot.mealName.toLowerCase().includes('breakfast')) {
      if (isVegan) {
        suggestedRecipe = 'Rolled Oats Porridge with Soya Milk & Crumbled Tofu';
        recipeNotes = 'Simmer raw oats in unsweetened soy milk. Sauté tofu with turmeric and green chillies as a side bhurji.';
        items = [
          { raw_food_item: 'Rolled Oats (Raw)', food_item: 'Rolled Oats (Raw)', raw_quantity: Math.max(30, Math.round(c * 0.6)), unit: 'g', portion_label: `${Math.max(30, Math.round(c * 0.6))}g raw`, portion: `${Math.max(30, Math.round(c * 0.6))}g raw oats`, calories: Math.round(c * 0.6 * 3.8), protein_g: Math.round(c * 0.6 * 0.13), carbs_g: Math.round(c * 0.6 * 0.66), fats_g: Math.round(c * 0.6 * 0.07), suggested_recipe: suggestedRecipe, notes: 'Rich in beta-glucans' },
          { raw_food_item: 'Unsweetened Soy Milk', food_item: 'Unsweetened Soy Milk', raw_quantity: 200, unit: 'ml', portion_label: '200 ml', portion: '200ml (1 cup)', calories: 90, protein_g: 7, carbs_g: 4, fats_g: 4, suggested_recipe: suggestedRecipe, notes: 'Plant-based protein' },
          { raw_food_item: 'Firm Tofu (Raw)', food_item: 'Firm Tofu (Raw)', raw_quantity: Math.max(80, Math.round(p * 2.2)), unit: 'g', portion_label: `${Math.max(80, Math.round(p * 2.2))}g`, portion: `${Math.max(80, Math.round(p * 2.2))}g raw tofu`, calories: Math.round(p * 2.2 * 1.2), protein_g: Math.round(p * 0.5), carbs_g: 2, fats_g: Math.max(2, Math.round(f * 0.4)), suggested_recipe: suggestedRecipe, notes: 'High bioavailability plant protein' },
          { raw_food_item: 'Raw Almonds', food_item: 'Raw Almonds', raw_quantity: 10, unit: 'g', portion_label: '10g (~8 nuts)', portion: '10g (8 nuts)', calories: 58, protein_g: 2, carbs_g: 2, fats_g: 5, suggested_recipe: suggestedRecipe, notes: 'Healthy fats & vitamin E' },
        ];
      } else if (isEgg || !isVeg) {
        suggestedRecipe = 'Masala Scrambled Eggs with Toasted Whole Wheat Bread';
        recipeNotes = 'Whisk eggs with onions, green chillies, and pinch of turmeric. Scramble lightly and serve with toast.';
        const wholeEggs = 2;
        const eggWhites = Math.max(1, Math.round((p - 14) / 4));
        items = [
          { raw_food_item: 'Whole Eggs', food_item: 'Whole Eggs', raw_quantity: wholeEggs, unit: 'eggs', portion_label: `${wholeEggs} whole eggs`, portion: `${wholeEggs} whole eggs`, calories: wholeEggs * 72, protein_g: wholeEggs * 6.3, carbs_g: 0.5, fats_g: wholeEggs * 4.8, suggested_recipe: suggestedRecipe, notes: 'Complete amino acid source' },
          { raw_food_item: 'Egg Whites', food_item: 'Egg Whites', raw_quantity: eggWhites, unit: 'eggs', portion_label: `${eggWhites} egg whites`, portion: `${eggWhites} egg whites`, calories: eggWhites * 17, protein_g: eggWhites * 3.6, carbs_g: 0.2, fats_g: 0.1, suggested_recipe: suggestedRecipe, notes: 'Pure lean protein' },
          { raw_food_item: '100% Whole Wheat Bread', food_item: '100% Whole Wheat Bread', raw_quantity: Math.max(1, Math.round(c / 18)), unit: 'slices', portion_label: `${Math.max(1, Math.round(c / 18))} slices`, portion: `${Math.max(1, Math.round(c / 18))} slices (~${Math.max(1, Math.round(c / 18)) * 30}g)`, calories: Math.max(1, Math.round(c / 18)) * 75, protein_g: Math.max(1, Math.round(c / 18)) * 3, carbs_g: Math.max(1, Math.round(c / 18)) * 14, fats_g: 1, suggested_recipe: suggestedRecipe, notes: 'Complex carbs for morning energy' },
          { raw_food_item: 'Olive Oil / Butter', food_item: 'Olive Oil / Butter', raw_quantity: 4, unit: 'g', portion_label: '4g (1 tsp)', portion: '4g (1 tsp)', calories: 36, protein_g: 0, carbs_g: 0, fats_g: 4, suggested_recipe: suggestedRecipe, notes: 'Cooking fat' },
        ];
      } else if (isJain) {
        suggestedRecipe = 'Paneer Moong Dal Chilla';
        recipeNotes = 'Grind soaked raw moong dal with cumin and rock salt. Spread on tawa, top with grated low-fat paneer, and fold.';
        items = [
          { raw_food_item: 'Yellow Moong Dal (Raw)', food_item: 'Yellow Moong Dal (Raw)', raw_quantity: 50, unit: 'g', portion_label: '50g raw', portion: '50g raw (~1/4 cup)', calories: 174, protein_g: 12, carbs_g: 30, fats_g: 0.6, suggested_recipe: suggestedRecipe, notes: 'Soak 2-3 hours and grind' },
          { raw_food_item: 'Low-Fat Paneer', food_item: 'Low-Fat Paneer', raw_quantity: Math.max(60, Math.round(p * 2.2)), unit: 'g', portion_label: `${Math.max(60, Math.round(p * 2.2))}g`, portion: `${Math.max(60, Math.round(p * 2.2))}g low-fat paneer`, calories: Math.round(p * 2.2 * 1.8), protein_g: Math.round(p * 0.55), carbs_g: 2, fats_g: Math.max(2, Math.round(f * 0.45)), suggested_recipe: suggestedRecipe, notes: 'Crumble as chilla filling' },
          { raw_food_item: 'Toned Cow Milk (Warm)', food_item: 'Toned Cow Milk (Warm)', raw_quantity: 150, unit: 'ml', portion_label: '150 ml', portion: '150ml (1 cup)', calories: 90, protein_g: 5, carbs_g: 7, fats_g: 4.5, suggested_recipe: suggestedRecipe, notes: 'With pinch of cinnamon' },
          { raw_food_item: 'Ghee / Olive Oil', food_item: 'Ghee / Olive Oil', raw_quantity: 3, unit: 'g', portion_label: '3g', portion: '3g (1/2 tsp)', calories: 27, protein_g: 0, carbs_g: 0, fats_g: 3, suggested_recipe: suggestedRecipe, notes: 'For brushing on tawa' },
        ];
      } else {
        suggestedRecipe = 'Paneer Moong Dal Chilla';
        recipeNotes = 'Soak moong dal, grind into smooth batter, cook on tawa and fill with spiced crumbled low-fat paneer.';
        items = [
          { raw_food_item: 'Yellow Moong Dal (Raw)', food_item: 'Yellow Moong Dal (Raw)', raw_quantity: 50, unit: 'g', portion_label: '50g raw', portion: '50g raw (~1/4 cup)', calories: 174, protein_g: 12, carbs_g: 30, fats_g: 0.6, suggested_recipe: suggestedRecipe, notes: 'High protein plant batter' },
          { raw_food_item: 'Low-Fat Paneer', food_item: 'Low-Fat Paneer', raw_quantity: Math.max(60, Math.round(p * 2.2)), unit: 'g', portion_label: `${Math.max(60, Math.round(p * 2.2))}g`, portion: `${Math.max(60, Math.round(p * 2.2))}g low-fat paneer`, calories: Math.round(p * 2.2 * 1.8), protein_g: Math.round(p * 0.55), carbs_g: 2, fats_g: Math.max(2, Math.round(f * 0.45)), suggested_recipe: suggestedRecipe, notes: 'Grated for chilla stuffing' },
          { raw_food_item: 'Rolled Oats (Raw)', food_item: 'Rolled Oats (Raw)', raw_quantity: 25, unit: 'g', portion_label: '25g raw', portion: '25g raw oats', calories: 97, protein_g: 3.5, carbs_g: 17, fats_g: 1.5, suggested_recipe: suggestedRecipe, notes: 'Blend into batter for fiber' },
          { raw_food_item: 'Ghee / Olive Oil', food_item: 'Ghee / Olive Oil', raw_quantity: 3, unit: 'g', portion_label: '3g', portion: '3g (1/2 tsp)', calories: 27, protein_g: 0, carbs_g: 0, fats_g: 3, suggested_recipe: suggestedRecipe, notes: 'For tawa cooking' },
        ];
      }
    } else if (slot.mealName.toLowerCase().includes('lunch')) {
      if (isVegan) {
        suggestedRecipe = 'High-Protein Soya Chunks Curry with Steamed Basmati Rice & Dal';
        recipeNotes = 'Boil soya chunks, squeeze water, and simmer in tomato-onion gravy. Serve alongside rice and yellow dal.';
        items = [
          { raw_food_item: 'Soya Chunks (Raw / Dry)', food_item: 'Soya Chunks (Raw / Dry)', raw_quantity: Math.max(35, Math.round(p * 0.8)), unit: 'g', portion_label: `${Math.max(35, Math.round(p * 0.8))}g dry`, portion: `${Math.max(35, Math.round(p * 0.8))}g dry soya chunks`, calories: Math.round(p * 0.8 * 3.4), protein_g: Math.round(p * 0.8 * 0.52), carbs_g: Math.round(p * 0.8 * 0.33), fats_g: 1, suggested_recipe: suggestedRecipe, notes: '52% protein by dry weight' },
          { raw_food_item: 'Basmati Rice (Raw)', food_item: 'Basmati Rice (Raw)', raw_quantity: Math.max(40, Math.round(c * 0.6)), unit: 'g', portion_label: `${Math.max(40, Math.round(c * 0.6))}g raw`, portion: `${Math.max(40, Math.round(c * 0.6))}g raw rice (~130g cooked)`, calories: Math.round(c * 0.6 * 3.5), protein_g: Math.round(c * 0.6 * 0.08), carbs_g: Math.round(c * 0.6 * 0.77), fats_g: 0.5, suggested_recipe: suggestedRecipe, notes: 'Steamed grain energy' },
          { raw_food_item: 'Yellow Toor/Moong Dal (Raw)', food_item: 'Yellow Toor/Moong Dal (Raw)', raw_quantity: 30, unit: 'g', portion_label: '30g raw', portion: '30g raw dal (~1 katori cooked)', calories: 105, protein_g: 6.5, carbs_g: 18, fats_g: 0.5, suggested_recipe: suggestedRecipe, notes: 'Lentil soup' },
          { raw_food_item: 'Cucumber & Tomato Salad', food_item: 'Cucumber & Tomato Salad', raw_quantity: 100, unit: 'g', portion_label: '100g', portion: '100g sliced salad with lemon', calories: 18, protein_g: 0.8, carbs_g: 3.5, fats_g: 0.2, suggested_recipe: suggestedRecipe, notes: 'Digestive fiber & vitamins' },
          { raw_food_item: 'Mustard / Olive Oil', food_item: 'Mustard / Olive Oil', raw_quantity: 4, unit: 'g', portion_label: '4g (1 tsp)', portion: '4g (1 tsp)', calories: 36, protein_g: 0, carbs_g: 0, fats_g: 4, suggested_recipe: suggestedRecipe, notes: 'For tempering dal & curry' },
        ];
      } else if (!isVeg) {
        suggestedRecipe = 'Spiced Grilled Chicken Breast with Steamed Rice, Dal & Dahi';
        recipeNotes = 'Marinate raw chicken in curd and spices, pan-sear or grill with 1 tsp oil. Serve with hot steamed rice and dal.';
        const chickenG = Math.max(100, Math.round(p * 2.8));
        items = [
          { raw_food_item: 'Skinless Chicken Breast (Raw)', food_item: 'Skinless Chicken Breast (Raw)', raw_quantity: chickenG, unit: 'g', portion_label: `${chickenG}g raw`, portion: `${chickenG}g raw chicken breast`, calories: Math.round(chickenG * 1.2), protein_g: Math.round(chickenG * 0.24), carbs_g: 0, fats_g: Math.round(chickenG * 0.025), suggested_recipe: suggestedRecipe, notes: 'Lean, complete amino acid profile' },
          { raw_food_item: 'Basmati Rice (Raw)', food_item: 'Basmati Rice (Raw)', raw_quantity: Math.max(40, Math.round(c * 0.55)), unit: 'g', portion_label: `${Math.max(40, Math.round(c * 0.55))}g raw`, portion: `${Math.max(40, Math.round(c * 0.55))}g raw rice (~130g cooked)`, calories: Math.round(c * 0.55 * 3.5), protein_g: Math.round(c * 0.55 * 0.08), carbs_g: Math.round(c * 0.55 * 0.77), fats_g: 0.5, suggested_recipe: suggestedRecipe, notes: 'Steamed staple grain' },
          { raw_food_item: 'Yellow Moong / Arhar Dal (Raw)', food_item: 'Yellow Moong / Arhar Dal (Raw)', raw_quantity: 25, unit: 'g', portion_label: '25g raw', portion: '25g raw dal (~1 katori cooked)', calories: 87, protein_g: 5.5, carbs_g: 15, fats_g: 0.4, suggested_recipe: suggestedRecipe, notes: 'Home cooked tadka dal' },
          { raw_food_item: 'Low-Fat Curd (Dahi)', food_item: 'Low-Fat Curd (Dahi)', raw_quantity: 100, unit: 'g', portion_label: '100g (1 katori)', portion: '100g low-fat dahi', calories: 60, protein_g: 4, carbs_g: 5, fats_g: 2.5, suggested_recipe: suggestedRecipe, notes: 'Probiotic gut support' },
          { raw_food_item: 'Olive Oil / Ghee', food_item: 'Olive Oil / Ghee', raw_quantity: 4, unit: 'g', portion_label: '4g (1 tsp)', portion: '4g (1 tsp)', calories: 36, protein_g: 0, carbs_g: 0, fats_g: 4, suggested_recipe: suggestedRecipe, notes: 'For cooking chicken & dal' },
        ];
      } else {
        suggestedRecipe = 'Matar Paneer with Whole Wheat Phulkas & Yellow Dal';
        recipeNotes = 'Sauté raw paneer cubes and green peas in light tomato gravy. Enjoy with freshly rolled whole wheat phulkas.';
        const paneerG = Math.max(80, Math.round(p * 2.2));
        items = [
          { raw_food_item: 'Low-Fat Paneer', food_item: 'Low-Fat Paneer', raw_quantity: paneerG, unit: 'g', portion_label: `${paneerG}g raw`, portion: `${paneerG}g low-fat paneer`, calories: Math.round(paneerG * 1.8), protein_g: Math.round(paneerG * 0.18), carbs_g: Math.round(paneerG * 0.03), fats_g: Math.round(paneerG * 0.11), suggested_recipe: suggestedRecipe, notes: 'Primary vegetarian protein' },
          { raw_food_item: 'Green Peas (Fresh/Frozen)', food_item: 'Green Peas (Fresh/Frozen)', raw_quantity: 40, unit: 'g', portion_label: '40g', portion: '40g green peas', calories: 32, protein_g: 2, carbs_g: 5.5, fats_g: 0.2, suggested_recipe: suggestedRecipe, notes: 'Fiber and micronutrients' },
          { raw_food_item: 'Whole Wheat Atta (Raw)', food_item: 'Whole Wheat Atta (Raw)', raw_quantity: Math.max(45, Math.round(c * 0.6)), unit: 'g', portion_label: `${Math.max(45, Math.round(c * 0.6))}g raw (~2 rotis)`, portion: `${Math.max(45, Math.round(c * 0.6))}g flour for 2 phulkas`, calories: Math.round(c * 0.6 * 3.4), protein_g: Math.round(c * 0.6 * 0.12), carbs_g: Math.round(c * 0.6 * 0.70), fats_g: 1, suggested_recipe: suggestedRecipe, notes: 'Unrefined complex grain' },
          { raw_food_item: 'Yellow Moong Dal (Raw)', food_item: 'Yellow Moong Dal (Raw)', raw_quantity: 25, unit: 'g', portion_label: '25g raw', portion: '25g raw dal (~1 katori)', calories: 87, protein_g: 5.5, carbs_g: 15, fats_g: 0.4, suggested_recipe: suggestedRecipe, notes: 'Tadka dal' },
          { raw_food_item: 'Ghee / Olive Oil', food_item: 'Ghee / Olive Oil', raw_quantity: 4, unit: 'g', portion_label: '4g (1 tsp)', portion: '4g (1 tsp)', calories: 36, protein_g: 0, carbs_g: 0, fats_g: 4, suggested_recipe: suggestedRecipe, notes: 'Cooking fat' },
        ];
      }
    } else if (slot.mealName.toLowerCase().includes('snack')) {
      suggestedRecipe = 'Roasted Chana & Almonds with Spiced Buttermilk';
      recipeNotes = 'Serve roasted Bengal gram with raw almonds alongside a chilled glass of cumin-spiced buttermilk.';
      items = [
        { raw_food_item: 'Roasted Chana (Bengal Gram)', food_item: 'Roasted Chana (Bengal Gram)', raw_quantity: Math.max(30, Math.round(c * 0.6)), unit: 'g', portion_label: `${Math.max(30, Math.round(c * 0.6))}g`, portion: `${Math.max(30, Math.round(c * 0.6))}g roasted chana`, calories: Math.round(c * 0.6 * 3.7), protein_g: Math.round(c * 0.6 * 0.20), carbs_g: Math.round(c * 0.6 * 0.58), fats_g: 2, suggested_recipe: suggestedRecipe, notes: 'Low GI crunch and fiber' },
        { raw_food_item: 'Raw Almonds / Walnuts', food_item: 'Raw Almonds / Walnuts', raw_quantity: 12, unit: 'g', portion_label: '12g (~10 nuts)', portion: '12g nuts', calories: 70, protein_g: 2.5, carbs_g: 2, fats_g: 6, suggested_recipe: suggestedRecipe, notes: 'Omega-3 and satiety' },
        { raw_food_item: 'Spiced Buttermilk (Chaas)', food_item: 'Spiced Buttermilk (Chaas)', raw_quantity: 200, unit: 'ml', portion_label: '200 ml', portion: '200ml spiced chaas', calories: 45, protein_g: 3, carbs_g: 4, fats_g: 1.5, suggested_recipe: suggestedRecipe, notes: 'Probiotic hydration' },
      ];
    } else {
      // Dinner
      if (!isVeg) {
        suggestedRecipe = 'Herb-Grilled Fish or Chicken with Sautéed Veggies & Whole Wheat Phulka';
        recipeNotes = 'Pan-sear marinated fish or chicken fillet in olive oil with bell peppers and green beans. Serve with 1-2 light phulkas.';
        const proteinG = Math.max(120, Math.round(p * 2.8));
        items = [
          { raw_food_item: 'Fish Fillet / Chicken Breast (Raw)', food_item: 'Fish Fillet / Chicken Breast (Raw)', raw_quantity: proteinG, unit: 'g', portion_label: `${proteinG}g raw`, portion: `${proteinG}g raw fillet`, calories: Math.round(proteinG * 1.15), protein_g: Math.round(proteinG * 0.23), carbs_g: 0, fats_g: Math.round(proteinG * 0.02), suggested_recipe: suggestedRecipe, notes: 'High biological value protein' },
          { raw_food_item: 'Whole Wheat Atta (Raw)', food_item: 'Whole Wheat Atta (Raw)', raw_quantity: Math.max(30, Math.round(c * 0.5)), unit: 'g', portion_label: `${Math.max(30, Math.round(c * 0.5))}g raw (~1-2 phulkas)`, portion: `${Math.max(30, Math.round(c * 0.5))}g flour for phulkas`, calories: Math.round(c * 0.5 * 3.4), protein_g: Math.round(c * 0.5 * 0.12), carbs_g: Math.round(c * 0.5 * 0.70), fats_g: 0.5, suggested_recipe: suggestedRecipe, notes: 'Easy to digest dinner carbs' },
          { raw_food_item: 'Mixed Bell Peppers & Green Beans', food_item: 'Mixed Bell Peppers & Green Beans', raw_quantity: 120, unit: 'g', portion_label: '120g raw', portion: '120g stir-fry veggies', calories: 35, protein_g: 1.5, carbs_g: 6, fats_g: 0.3, suggested_recipe: suggestedRecipe, notes: 'Sautéed with black pepper' },
          { raw_food_item: 'Olive Oil / Ghee', food_item: 'Olive Oil / Ghee', raw_quantity: 3, unit: 'g', portion_label: '3g', portion: '3g (1/2 tsp)', calories: 27, protein_g: 0, carbs_g: 0, fats_g: 3, suggested_recipe: suggestedRecipe, notes: 'For pan-searing' },
        ];
      } else {
        suggestedRecipe = 'Tawa Paneer Bhurji with Whole Wheat Phulkas & Green Sabzi';
        recipeNotes = 'Crumble fresh low-fat paneer and sauté with tomatoes, capsicum, and cumin. Pair with freshly prepared phulkas.';
        const paneerG = Math.max(80, Math.round(p * 2.2));
        items = [
          { raw_food_item: 'Low-Fat Paneer (Raw)', food_item: 'Low-Fat Paneer (Raw)', raw_quantity: paneerG, unit: 'g', portion_label: `${paneerG}g raw`, portion: `${paneerG}g fresh low-fat paneer`, calories: Math.round(paneerG * 1.8), protein_g: Math.round(paneerG * 0.18), carbs_g: Math.round(paneerG * 0.03), fats_g: Math.round(paneerG * 0.11), suggested_recipe: suggestedRecipe, notes: 'Slow-digesting casein protein' },
          { raw_food_item: 'Whole Wheat Atta (Raw)', food_item: 'Whole Wheat Atta (Raw)', raw_quantity: Math.max(35, Math.round(c * 0.55)), unit: 'g', portion_label: `${Math.max(35, Math.round(c * 0.55))}g raw (~2 phulkas)`, portion: `${Math.max(35, Math.round(c * 0.55))}g flour for phulkas`, calories: Math.round(c * 0.55 * 3.4), protein_g: Math.round(c * 0.55 * 0.12), carbs_g: Math.round(c * 0.55 * 0.70), fats_g: 0.5, suggested_recipe: suggestedRecipe, notes: 'Whole grain foundation' },
          { raw_food_item: 'Seasonal Sabzi (Bhindi / Beans / Gobhi)', food_item: 'Seasonal Sabzi (Bhindi / Beans / Gobhi)', raw_quantity: 120, unit: 'g', portion_label: '120g', portion: '120g cooked sabzi', calories: 45, protein_g: 2, carbs_g: 8, fats_g: 1, suggested_recipe: suggestedRecipe, notes: 'Digestive dietary fiber' },
          { raw_food_item: 'Ghee / Olive Oil', food_item: 'Ghee / Olive Oil', raw_quantity: 3, unit: 'g', portion_label: '3g', portion: '3g (1/2 tsp)', calories: 27, protein_g: 0, carbs_g: 0, fats_g: 3, suggested_recipe: suggestedRecipe, notes: 'For tempering bhurji' },
        ];
      }
    }

    return {
      meal_name: slot.mealName,
      target_time: slot.targetTime,
      suggested_recipe: suggestedRecipe,
      recipe_notes: recipeNotes,
      calories: cal,
      macros: {
        protein_g: p,
        carbs_g: c,
        fats_g: f,
      },
      items,
    };
  });

  return {
    day_summary: {
      total_calories: targets.calorieTarget,
      total_protein_g: targets.proteinG,
      total_carbs_g: targets.carbsG,
      total_fats_g: targets.fatsG,
    },
    meals,
  };
}

// Deterministic Kinesiology Routine Fallback
function generateDeterministicFallbackWorkoutPlan(params: any) {
  const { goal = 'Muscle Building', difficulty = 'Intermediate', daysPerWeek = 4, splitPreference = 'Upper / Lower', equipmentAvailable = 'Commercial Gym' } = params;

  let days: any[] = [];
  if (daysPerWeek === 3) {
    days = [
      {
        day_name: 'Day 1: Full Body (Squat & Push Focus)',
        is_rest_day: false,
        focus: 'Compound Lower & Upper Push Hypertrophy',
        exercises: [
          { name: 'Barbell Back Squats / Goblet Squat', target_muscle: 'Quadriceps & Glutes', sets: 4, reps: '8-10', rest_seconds: 90, notes: 'Hit parallel depth, maintain rigid core bracing.' },
          { name: 'Incline Dumbbell Bench Press', target_muscle: 'Chest (Clavicular Head)', sets: 4, reps: '8-12', rest_seconds: 75, notes: 'Control the descent, full stretch at the bottom.' },
          { name: 'Seated Cable Rows', target_muscle: 'Upper Back & Lats', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Retract scapulae fully, pull towards lower ribcage.' },
          { name: 'Dumbbell Romanian Deadlift', target_muscle: 'Hamstrings & Glutes', sets: 3, reps: '10-12', rest_seconds: 75, notes: 'Hinge back at hips with soft knees, feel hamstring stretch.' },
          { name: 'Hanging Leg Raises / Plank', target_muscle: 'Core / Abs', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Prevent swinging, tuck pelvis on flexion.' },
        ],
      },
      {
        day_name: 'Day 2: Active Recovery & Mobility',
        is_rest_day: true,
        focus: 'Joint Health, Foam Rolling & Light Walking',
        exercises: [],
      },
      {
        day_name: 'Day 3: Full Body (Hinge & Pull Focus)',
        is_rest_day: false,
        focus: 'Posterior Chain & Upper Pull Hypertrophy',
        exercises: [
          { name: 'Conventional Deadlift / Trap Bar Deadlift', target_muscle: 'Posterior Chain (Glutes & Erector Spinae)', sets: 3, reps: '6-8', rest_seconds: 120, notes: 'Lock hips, wedge bar against shins before pull.' },
          { name: 'Lat Pulldowns (Neutral or Wide Grip)', target_muscle: 'Latissimus Dorsi', sets: 4, reps: '10-12', rest_seconds: 60, notes: 'Drive elbows down towards hips, hold 1s at contraction.' },
          { name: 'Standing Overhead Barbell/Dumbbell Press', target_muscle: 'Anterior Deltoids & Triceps', sets: 3, reps: '8-10', rest_seconds: 75, notes: 'Brace core, avoid arching lower back at lockout.' },
          { name: 'Dumbbell Walking Lunges', target_muscle: 'Quadriceps & Glutes', sets: 3, reps: '12 per leg', rest_seconds: 60, notes: 'Upright torso, knee touches floor gently.' },
          { name: 'Face Pulls with Rope', target_muscle: 'Rear Deltoids & Rotator Cuff', sets: 3, reps: '15-20', rest_seconds: 45, notes: 'Pull rope apart towards eye level for shoulder health.' },
        ],
      },
      {
        day_name: 'Day 4: Rest & Regeneration',
        is_rest_day: true,
        focus: 'Sleep, Hydration & Tissue Recovery',
        exercises: [],
      },
      {
        day_name: 'Day 5: Full Body (Hypertrophy & Pump)',
        is_rest_day: false,
        focus: 'High Rep Conditioning & Muscle Endurance',
        exercises: [
          { name: 'Leg Press', target_muscle: 'Quadriceps & Glutes', sets: 4, reps: '12-15', rest_seconds: 60, notes: 'Controlled tempo, do not lock knees at top.' },
          { name: 'Dumbbell Flat Bench Press', target_muscle: 'Chest', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Tuck elbows at 45 degrees, explode upward.' },
          { name: 'One-Arm Dumbbell Row', target_muscle: 'Lats & Rhomboids', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Keep torso parallel to ground, full range of motion.' },
          { name: 'Incline Dumbbell Bicep Curls', target_muscle: 'Biceps', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Keep shoulders back, supinate wrists at peak.' },
          { name: 'Cable Tricep Rope Pushdowns', target_muscle: 'Triceps', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Flay rope out at bottom, lock elbows in place.' },
        ],
      },
    ];
  } else {
    // 4 to 5 day default Upper / Lower split
    days = [
      {
        day_name: 'Day 1: Upper Body (Strength & Power)',
        is_rest_day: false,
        focus: 'Chest, Upper Back, Shoulders & Arms',
        exercises: [
          { name: 'Flat Barbell Bench Press', target_muscle: 'Pectoralis Major', sets: 4, reps: '6-8', rest_seconds: 90, notes: 'Grip outside shoulder width, control eccentric phase.' },
          { name: 'Barbell Bent-Over Row', target_muscle: 'Latissimus Dorsi & Rhomboids', sets: 4, reps: '8-10', rest_seconds: 75, notes: 'Hinge 45 degrees, pull bar to upper abdomen.' },
          { name: 'Overhead Dumbbell Shoulder Press', target_muscle: 'Anterior & Lateral Deltoids', sets: 3, reps: '8-10', rest_seconds: 60, notes: 'Full extension, avoid excessive lumbar arching.' },
          { name: 'Lat Pulldowns (Close Grip)', target_muscle: 'Lats & Mid-Back', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Pull chest tall to meet the bar.' },
          { name: 'Barbell EZ-Bar Bicep Curl & Tricep Skullcrushers Superset', target_muscle: 'Arms (Biceps & Triceps)', sets: 3, reps: '10-12', rest_seconds: 60, notes: 'Strict elbow fixation, continuous tension.' },
        ],
      },
      {
        day_name: 'Day 2: Lower Body (Quad & Calf Focus)',
        is_rest_day: false,
        focus: 'Quadriceps, Glutes, Hamstrings & Calves',
        exercises: [
          { name: 'Barbell Back Squat / Hack Squat', target_muscle: 'Quadriceps & Glutes', sets: 4, reps: '8-10', rest_seconds: 90, notes: 'Spread floor with feet, maintain neutral spine.' },
          { name: 'Romanian Deadlift (Dumbbell or Barbell)', target_muscle: 'Hamstrings & Posterior Glutes', sets: 3, reps: '10-12', rest_seconds: 75, notes: 'Focus on maximum hamstring stretch, soft knees.' },
          { name: 'Leg Press (Narrow Stance)', target_muscle: 'Quadriceps', sets: 3, reps: '12-15', rest_seconds: 60, notes: 'Consistent cadence, pause 1s at bottom.' },
          { name: 'Lying or Seated Leg Curls', target_muscle: 'Hamstrings', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Control the release, peak squeeze at peak contraction.' },
          { name: 'Standing Calf Raises', target_muscle: 'Gastrocnemius & Soleus', sets: 4, reps: '15-20', rest_seconds: 45, notes: 'Deep stretch at bottom, hold contraction for 2s.' },
        ],
      },
      {
        day_name: 'Day 3: Mid-Week Active Recovery',
        is_rest_day: true,
        focus: 'Cardiovascular Conditioning & Dynamic Mobility',
        exercises: [],
      },
      {
        day_name: 'Day 4: Upper Body (Hypertrophy & Volume)',
        is_rest_day: false,
        focus: 'High Repetition Deltoid, Chest & Back Sculpting',
        exercises: [
          { name: 'Incline Dumbbell Press', target_muscle: 'Upper Chest', sets: 4, reps: '10-12', rest_seconds: 75, notes: 'Set bench to 30 degrees, press with controlled tempo.' },
          { name: 'Seated Cable Row (Wide Grip)', target_muscle: 'Upper Back & Rear Delts', sets: 4, reps: '10-12', rest_seconds: 60, notes: 'Squeeze shoulder blades together firmly on each rep.' },
          { name: 'Dumbbell Lateral Raises', target_muscle: 'Lateral Deltoids', sets: 4, reps: '12-15', rest_seconds: 45, notes: 'Slight forward lean, lead with elbows for capped delts.' },
          { name: 'Pec Deck Flyes or Cable Crossovers', target_muscle: 'Sternal Chest', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Focus on deep inner chest squeeze.' },
          { name: 'Cable Overhead Tricep Extension & Hammer Curls', target_muscle: 'Triceps Long Head & Brachialis', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Constant cable tension throughout range of motion.' },
        ],
      },
      {
        day_name: 'Day 5: Lower Body (Posterior Chain & Core Focus)',
        is_rest_day: false,
        focus: 'Hamstrings, Glute Strength & Abdominal Core',
        exercises: [
          { name: 'Barbell Hip Thrust / Glute Drive', target_muscle: 'Gluteus Maximus', sets: 4, reps: '10-12', rest_seconds: 75, notes: 'Lock hips at top, pause for 1s, keep ribs down.' },
          { name: 'Bulgarian Split Squats', target_muscle: 'Single Leg Quad & Glute Stability', sets: 3, reps: '10 per leg', rest_seconds: 60, notes: 'Elevate back foot, descend straight down without caving knee.' },
          { name: 'Seated Hamstring Curls', target_muscle: 'Hamstrings', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Point toes toward shins to emphasize hamstring recruitment.' },
          { name: 'Leg Extensions (Machine)', target_muscle: 'Quadriceps (Rectus Femoris)', sets: 3, reps: '15-20', rest_seconds: 45, notes: 'Hold 1s lockout at top for maximum quad burn.' },
          { name: 'Hanging Knee Raises / Ab Wheel Rollout', target_muscle: 'Anterior Core & Rectus Abdominis', sets: 3, reps: '12-15', rest_seconds: 45, notes: 'Slow eccentric return, avoid hip flexor dominance.' },
        ],
      },
    ];
  }

  return {
    plan_name: `${goal} Routine (${daysPerWeek}-Day)`,
    goal,
    difficulty,
    days_per_week: daysPerWeek,
    coach_notes: `Evidence-based ${splitPreference} program calibrated for ${equipmentAvailable}. Progressive overload focused.`,
    days,
  };
}

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
  {
    id: 'usr_atul_gupta',
    email: 'akg.atulgupta@gmail.com',
    name: 'Atul Gupta',
    role: 'unpaid',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-09-11T07:15:00Z',
    lastLoginAt: '2026-09-12T08:30:00Z',
    phone: '+91 98114 00612',
    profileCompletion: 100,
    onboardingCompletion: 100,
    notes: 'Member signed up via Google OAuth. Completed health questionnaire and submitted Week 1 Tracker check-in.',
    profile: {
      email: 'akg.atulgupta@gmail.com',
      firstName: 'Atul',
      lastName: 'Gupta',
      dateOfBirth: '1985-11-20',
      age: '40',
      gender: 'Male',
      phone: '+91 98114 00612',
      address: 'Pocket B, Sarita Vihar',
      city: 'New Delhi',
      state: 'Delhi',
      zipcode: '110076',
      preferredContact: 'Whatsapp Audio/Video/Message',
      maritalStatus: 'Married',
      children: 'Yes',
      isPregnant: 'Not applicable',
      bloodGroup: 'B+',
      livingWith: 'Family',
      primaryCareProvider: 'Max Healthcare Delhi',
      lastCheckupDate: '2026-05-10',
      healthDataConsent: true,
      notificationsConsent: true,
      isConsentWithdrawn: false,
    },
    onboarding: {
      healthGoal: 'Weight Loss & Lean Muscle',
      coreReasonWhy: 'Increase daily stamina and reduce waistline while managing corporate desk work.',
      pastDietsAndTechniques: 'Intermittent fasting',
      biggestNutritionChallenges: 'Managing evening cravings after work',
      desiredHealthHabitChanges: 'Consistent 8,000+ daily steps and regular strength workouts.',
      currentPhysicalActivities: ['Walking / Brisk Walking', 'Gym Strength Training'],
      physicalActivityDaysPerWeek: '4',
      physicalActivityDurationMinutes: '45',
      gymAccess: 'yes',
      foodAllergies: 'None',
      dislikedFoods: 'Bitter gourd',
      dietPreferences: ['Vegetarian', 'High Protein'],
      mealsEatenRegularly: ['Breakfast', 'Lunch', 'Dinner'],
      dailyBeverageOfChoice: ['Black Coffee', 'Green Tea'],
      currentWeightKg: '72.8',
      heightCm: '174',
      waistInches: '36.0',
      hipInches: '39.0',
      neckInches: '15.5',
      chestInches: '39.5',
      upperArmInches: '13.5',
      quadricepsInches: '22.0',
      headachesScore: 1,
      insomniaScore: 1,
      digestiveIssuesScore: 1,
      dizzinessScore: 1,
      faintnessScore: 1,
      emotionalIssuesScore: 1,
      completedSections: [1, 2, 3, 4, 5],
      isSubmitted: true,
      healthDataConsent: true,
      notificationsConsent: true,
      isConsentWithdrawn: false,
    },
  },
];

// In-memory weekly entries repository with pre-seeded sample data
const serverWeeklyEntries: any[] = [
  // Pre-seeded Atul Gupta check-in
  {
    id: 'chk_atul_w1',
    userId: 'usr_atul_gupta',
    userEmail: 'akg.atulgupta@gmail.com',
    firstName: 'Atul',
    lastName: 'Gupta',
    checkInDate: '2026-09-11',
    weekNumber: 1,
    avgStepsPerDay: 8000,
    weightKg: 72.8,
    waistInches: 36.0,
    hipsInches: 39.0,
    neckInches: 15.5,
    quadsInches: 22.0,
    chestInches: 39.5,
    upperRightArmInches: 13.5,
    resistanceWorkoutDays: 3,
    hiitCardioDays: 1,
    avgCaloriesPerDay: 2050,
    frontPicUrl: '',
    leftPicUrl: '',
    rightPicUrl: '',
    backPicUrl: '',
    challengesFaced: 'Sedentary desk job during week, but hit 8k daily steps and completed 3 strength workouts.',
    coachFeedback: 'Excellent baseline Atul! Great adherence on workouts and steps. Let us maintain this momentum for Week 2.',
    createdAt: '2026-09-11T08:00:00Z',
  },
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
    neckInches: 13.5,
    quadsInches: 22.0,
    chestInches: 36.0,
    upperRightArmInches: 12.0,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 2,
    avgCaloriesPerDay: 1880,
    frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'Energy levels much better throughout work days. Managed to hit 9k steps comfortably.',
    coachFeedback: 'Consistent downward trend in weight and waist! Increasing water intake recommendation to 3.5L.',
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
    waistInches: 31.2,
    hipsInches: 39.0,
    neckInches: 13.0,
    quadsInches: 21.8,
    chestInches: 36.0,
    upperRightArmInches: 11.8,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 3,
    avgCaloriesPerDay: 1820,
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
    checkInDate: '2026-08-28',
    weekNumber: 2,
    avgStepsPerDay: 7900,
    weightKg: 83.6,
    waistInches: 35.2,
    hipsInches: 39.8,
    neckInches: 15.8,
    quadsInches: 22.5,
    chestInches: 39.5,
    upperRightArmInches: 13.5,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 2,
    avgCaloriesPerDay: 2280,
    frontPicUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'Traveling for business on Thursday, but chose grilled chicken salad and kept steps high.',
    coachFeedback: 'Outstanding self-discipline while traveling! -1.2 kg in Week 2. Keep prioritizing protein.',
    createdAt: '2026-08-28T09:30:00Z',
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

// Persistent file storage directory for reliable cross-restart data retention
const DATA_DIR = path.join(process.cwd(), '.server_data');
const WEEKLY_ENTRIES_FILE = path.join(DATA_DIR, 'weekly_tracker_entries.json');
const MEMBERS_FILE = path.join(DATA_DIR, 'server_members.json');
const MEAL_PLANS_FILE = path.join(DATA_DIR, 'server_meal_plans.json');
const WORKOUT_PLANS_FILE = path.join(DATA_DIR, 'server_workout_plans.json');

// In-memory repositories for meal and workout plans
let serverMealPlans: any[] = [];
let serverWorkoutPlans: any[] = [];

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Failed to ensure data dir:', err);
  }
}

function persistWeeklyEntries() {
  try {
    ensureDataDir();
    fs.writeFileSync(WEEKLY_ENTRIES_FILE, JSON.stringify(serverWeeklyEntries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write weekly entries to file:', err);
  }
}

function loadPersistedWeeklyEntries() {
  try {
    if (fs.existsSync(WEEKLY_ENTRIES_FILE)) {
      const raw = fs.readFileSync(WEEKLY_ENTRIES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(serverWeeklyEntries.map((e) => e.id));
        parsed.forEach((item: any) => {
          if (!existingIds.has(item.id)) {
            serverWeeklyEntries.push(item);
            existingIds.add(item.id);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load persisted weekly entries:', err);
  }
}

function persistMembers() {
  try {
    ensureDataDir();
    fs.writeFileSync(MEMBERS_FILE, JSON.stringify(serverMembers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write members to file:', err);
  }
}

function loadPersistedMembers() {
  try {
    if (fs.existsSync(MEMBERS_FILE)) {
      const raw = fs.readFileSync(MEMBERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingEmails = new Set(serverMembers.map((m) => m.email.toLowerCase().trim()));
        parsed.forEach((item: any) => {
          const email = (item.email || '').toLowerCase().trim();
          if (email && !existingEmails.has(email)) {
            serverMembers.push(item);
            existingEmails.add(email);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load persisted members:', err);
  }
}

function persistMealPlans() {
  try {
    ensureDataDir();
    fs.writeFileSync(MEAL_PLANS_FILE, JSON.stringify(serverMealPlans, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write meal plans to file:', err);
  }
}

function loadPersistedMealPlans() {
  try {
    if (fs.existsSync(MEAL_PLANS_FILE)) {
      const raw = fs.readFileSync(MEAL_PLANS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        serverMealPlans = parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load persisted meal plans:', err);
  }
}

function persistWorkoutPlans() {
  try {
    ensureDataDir();
    fs.writeFileSync(WORKOUT_PLANS_FILE, JSON.stringify(serverWorkoutPlans, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write workout plans to file:', err);
  }
}

function loadPersistedWorkoutPlans() {
  try {
    if (fs.existsSync(WORKOUT_PLANS_FILE)) {
      const raw = fs.readFileSync(WORKOUT_PLANS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        serverWorkoutPlans = parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load persisted workout plans:', err);
  }
}

function isUserAdmin(email?: string): boolean {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  if (DEFAULT_ADMIN_EMAILS.includes(norm)) return true;
  const member = serverMembers.find((m) => m.email.toLowerCase() === norm);
  return member?.role === 'admin';
}

async function startServer() {
  // Load persisted members, weekly entries, meal plans, and workout plans from disk storage
  loadPersistedMembers();
  loadPersistedWeeklyEntries();
  loadPersistedMealPlans();
  loadPersistedWorkoutPlans();
  persistMembers();
  persistWeeklyEntries();
  persistMealPlans();
  persistWorkoutPlans();

  const app = express();
  const PORT = 3000;

  // Support large photo payloads (progression photos, check-in data) up to 50MB
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
        hint: 'Only chinmay4jain@gmail.com and authorized admins can view member directory.'
      });
    }

    // Attach latest weeklyEntries to each member for instant access in coach portal
    const enrichedMembers = serverMembers.map((member) => {
      const memberEmail = (member.email || '').toLowerCase().trim();
      const entries = serverWeeklyEntries.filter((e) => e.userEmail && e.userEmail.toLowerCase().trim() === memberEmail);
      return {
        ...member,
        weeklyEntries: entries,
      };
    });

    return res.json({
      success: true,
      count: enrichedMembers.length,
      members: enrichedMembers,
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

    // Attach fresh weekly entries
    const memberEmail = (member.email || '').toLowerCase().trim();
    const entries = serverWeeklyEntries.filter((e) => e.userEmail && e.userEmail.toLowerCase().trim() === memberEmail);

    return res.json({ success: true, member: { ...member, weeklyEntries: entries } });
  });

  // POST /api/members/sync: Syncs a user profile / onboarding / tracker data to server
  app.post('/api/members/sync', (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming) {
        return res.status(400).json({ error: 'Payload is required for member sync.' });
      }

      let emailKey = (incoming.email || '').toLowerCase().trim();
      if (!emailKey && incoming.id) {
        const found = serverMembers.find((m) => m.id === incoming.id);
        if (found) emailKey = found.email.toLowerCase().trim();
      }

      if (!emailKey) {
        return res.status(400).json({ error: 'Email or valid ID is required for member sync.' });
      }

      const isAdminEmail = DEFAULT_ADMIN_EMAILS.includes(emailKey);
      
      const existingIndex = serverMembers.findIndex(
        (m) => m.email.toLowerCase() === emailKey || (incoming.id && m.id === incoming.id)
      );

      let finalRole = incoming.role || 'unpaid';
      if (isAdminEmail) {
        finalRole = 'admin';
      }

      if (existingIndex >= 0) {
        const existing = serverMembers[existingIndex];
        const cleanIncomingProfile = incoming.profile
          ? Object.fromEntries(
              Object.entries(incoming.profile).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            )
          : {};
        const mergedProfile = { ...(existing.profile || {}), ...cleanIncomingProfile };

        const cleanIncomingOnboarding = incoming.onboarding
          ? Object.fromEntries(
              Object.entries(incoming.onboarding).filter(
                ([_, v]) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
              )
            )
          : {};
        const mergedOnboarding = { ...(existing.onboarding || {}), ...cleanIncomingOnboarding };

        const finalProfileRate = (incoming.profileCompletion && incoming.profileCompletion > 0)
          ? incoming.profileCompletion
          : (existing.profileCompletion || 0);

        const finalOnboardingRate = (incoming.onboardingCompletion && incoming.onboardingCompletion > 0)
          ? incoming.onboardingCompletion
          : (existing.onboardingCompletion || 0);

        serverMembers[existingIndex] = {
          ...existing,
          ...incoming,
          name: incoming.name || existing.name,
          phone: incoming.phone || existing.phone,
          profile: mergedProfile,
          onboarding: mergedOnboarding,
          profileCompletion: finalProfileRate,
          onboardingCompletion: finalOnboardingRate,
          role: isAdminEmail ? 'admin' : (existing.role || finalRole),
          notes: incoming.notes !== undefined ? incoming.notes : existing.notes,
          lastLoginAt: new Date().toISOString(),
        };

        if (Array.isArray(incoming.weeklyEntries) && incoming.weeklyEntries.length > 0) {
          serverMembers[existingIndex].weeklyEntries = incoming.weeklyEntries;
        }

        persistMembers();
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
          weeklyEntries: incoming.weeklyEntries || [],
        };
        serverMembers.unshift(newMember);
        persistMembers();
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
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
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
    persistMembers();
    return res.json({ success: true, member: serverMembers[memberIndex] });
  });

  // PATCH /api/members/:id/notes: Super Admin action to update clinical/coach notes
  app.patch('/api/members/:id/notes', (req, res) => {
    const { id } = req.params;
    const { notes, callerEmail } = req.body;

    if (!isUserAdmin(callerEmail)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    const memberIndex = serverMembers.findIndex(
      (m) => m.id === id || m.email.toLowerCase() === id.toLowerCase().trim()
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    serverMembers[memberIndex].notes = notes;
    persistMembers();
    return res.json({ success: true, member: serverMembers[memberIndex] });
  });

  // =========================================================================
  // WEEKLY HEALTH TRACKER ENDPOINTS (Strict Privacy & Admin Visibility)
  // =========================================================================
  const legacyInitialEntries: any[] = [
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

  // Merge seed items into module-scoped serverWeeklyEntries if not already present
  legacyInitialEntries.forEach((entry) => {
    if (!serverWeeklyEntries.some((e) => e.id === entry.id)) {
      serverWeeklyEntries.push(entry);
    }
  });

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
    persistWeeklyEntries();

    // Also update serverMembers with the latest weekly entries for this user so Admin Portal gets instant parity
    const memIdx = serverMembers.findIndex((m) => m.email.toLowerCase().trim() === entryEmail);
    if (memIdx >= 0) {
      const userEntries = serverWeeklyEntries.filter((e) => e.userEmail && e.userEmail.toLowerCase().trim() === entryEmail);
      serverMembers[memIdx].weeklyEntries = userEntries;
      persistMembers();
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
      const deleted = serverWeeklyEntries.splice(index, 1)[0];
      persistWeeklyEntries();

      const targetEmail = (deleted.userEmail || userEmail).toLowerCase().trim();
      const memIdx = serverMembers.findIndex((m) => m.email.toLowerCase().trim() === targetEmail);
      if (memIdx >= 0) {
        serverMembers[memIdx].weeklyEntries = serverWeeklyEntries.filter((e) => e.userEmail && e.userEmail.toLowerCase().trim() === targetEmail);
        persistMembers();
      }
    }

    return res.json({ success: true, message: 'Check-in deleted.' });
  });

  // =========================================================================
  // MEAL & NUTRITION PLANS ENDPOINTS (Cross-Device Sync)
  // =========================================================================

  // GET /api/meal-plans: Fetch meal plans
  app.get('/api/meal-plans', (req, res) => {
    const userEmail = (req.query.userEmail as string || '').toLowerCase().trim();
    if (userEmail) {
      const filtered = serverMealPlans.filter(
        (p) => (p.userEmail && p.userEmail.toLowerCase().trim() === userEmail) ||
               (p.userId && p.userId.toLowerCase().trim() === userEmail)
      );
      return res.json({ success: true, plans: filtered });
    }
    return res.json({ success: true, plans: serverMealPlans });
  });

  // POST /api/meal-plans: Save or sync meal plans
  app.post('/api/meal-plans', (req, res) => {
    try {
      const incoming = req.body;
      const plansToSync: any[] = Array.isArray(incoming) ? incoming : (incoming?.plans || [incoming]);

      plansToSync.forEach((plan) => {
        if (!plan || !plan.id) return;
        const idx = serverMealPlans.findIndex((p) => p.id === plan.id);
        if (idx >= 0) {
          serverMealPlans[idx] = { ...serverMealPlans[idx], ...plan, updatedAt: new Date().toISOString() };
        } else {
          serverMealPlans.unshift({ ...plan, updatedAt: new Date().toISOString() });
        }
      });
      persistMealPlans();
      return res.json({ success: true, plans: serverMealPlans });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save meal plans' });
    }
  });

  // =========================================================================
  // AI-DRIVEN DETERMINISTIC MEAL PLAN GENERATION (HYBRID ARCHITECTURE)
  // =========================================================================

  // POST /api/generate-meal-plan
  // Receives onboarding profile & pre-computed deterministic targets, calls Gemini with strict JSON Schema
  app.post('/api/generate-meal-plan', async (req, res) => {
    try {
      const { profile, targets } = req.body;
      if (!targets || !targets.calorieTarget || !targets.proteinG) {
        return res.status(400).json({ error: 'Deterministic nutrition targets are required.' });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          hint: 'Please provide GEMINI_API_KEY in environment secrets.',
        });
      }

      const dietaryRestrictionsStr = Array.isArray(profile?.dietaryRestrictions) && profile.dietaryRestrictions.length > 0
        ? profile.dietaryRestrictions.join(', ')
        : 'Vegetarian';

      const dislikesAndAllergiesStr = Array.isArray(profile?.foodDislikesAllergies) && profile.foodDislikesAllergies.length > 0
        ? profile.foodDislikesAllergies.join(', ')
        : 'None declared';

      const cuisineStyle = profile?.cuisineStyle || 'Indian (North & South Indian balanced)';

      const mealAllocationsPrompt = Array.isArray(targets.mealAllocations)
        ? targets.mealAllocations
            .map(
              (m: any) =>
                `- ${m.mealName} (approx ${m.targetTime}): Target ~${m.targetCalories} kcal (Protein: ~${m.targetProteinG}g, Carbs: ~${m.targetCarbsG}g, Fats: ~${m.targetFatsG}g)`
            )
            .join('\n')
        : '- Standard 3 meals + 1 snack';

      const systemInstruction = `You are an expert clinical sports nutritionist and dietitian for the Fitkode platform.
Generate a realistic 1-day sample meal plan adhering strictly to the user's dietary preferences and target macros.

CRITICAL ARCHITECTURAL RULES (STRICT USER REQUIREMENT):
1. DO NOT STRUCTURE THE MEAL PLAN WITH THE RECIPE FIRST.
2. DO NOT combine entire meals into a single composite recipe line item (e.g., do NOT output a single item called "Paneer Moong Dal Chilla").
3. Instead, EVERY food item must be an INDIVIDUAL RAW LINE ITEM with its exact raw quantity, unit, portion label, and individual macro contribution.
   Example for Breakfast:
   - Item 1: Yellow Moong Dal (Raw), 50g
   - Item 2: Low-Fat Paneer, 80g
   - Item 3: Rolled Oats (Raw), 25g
   - Item 4: Ghee / Olive Oil, 3g
4. The composite or finished dish MUST be provided in the separate 'suggested_recipe' field (e.g. "Paneer Moong Dal Chilla").
5. Match the total daily calories and macros within a +/- 5% error margin against the provided targets.
6. Exclude all declared allergens and disliked foods: ${dislikesAndAllergiesStr}.
7. Ensure practical home-cooked staples (paneer, eggs, chicken breast, oats, soya chunks, curd/dahi, lentils/dal, seasonal sabzi, tofu).
8. If Jain: no root vegetables (onion, garlic, potato, carrot). If Lactose-Free: plant milks/tofu. If Vegan: no dairy/honey/eggs.`;

      const prompt = `Generate a realistic 1-day meal plan for:
- Dietary Restrictions: ${dietaryRestrictionsStr}
- Excluded Dislikes & Allergies: ${dislikesAndAllergiesStr}
- Preferred Cuisine: ${cuisineStyle}
- Fitness Goal: ${profile?.fitnessGoal || 'Fat Loss'}

DETERMINISTIC TARGETS TO MATCH EXACTLY (+/- 5%):
- Total Daily Calories: ${targets.calorieTarget} kcal
- Total Protein: ${targets.proteinG} g
- Total Carbs: ${targets.carbsG} g
- Total Fats: ${targets.fatsG} g

Target Per-Meal Budget:
${mealAllocationsPrompt}

REMINDER: Structure by raw line items first (raw ingredient + raw quantity). In the 'suggested_recipe' field, indicate how these raw items come together into a suggested recipe (e.g. 'Paneer Moong Dal Chilla').`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          day_summary: {
            type: Type.OBJECT,
            properties: {
              total_calories: { type: Type.INTEGER, description: 'Sum of all meals calories' },
              total_protein_g: { type: Type.INTEGER, description: 'Total protein in grams' },
              total_carbs_g: { type: Type.INTEGER, description: 'Total carbs in grams' },
              total_fats_g: { type: Type.INTEGER, description: 'Total fats in grams' },
            },
            required: ['total_calories', 'total_protein_g', 'total_carbs_g', 'total_fats_g'],
          },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                meal_name: { type: Type.STRING, description: 'e.g. Breakfast, Lunch, Evening Snack, Dinner' },
                target_time: { type: Type.STRING, description: 'e.g. 08:30 AM' },
                suggested_recipe: { type: Type.STRING, description: 'e.g. Paneer Moong Dal Chilla, Grilled Chicken Rice Bowl' },
                recipe_notes: { type: Type.STRING, description: 'Preparation / cooking idea combining these raw line items' },
                calories: { type: Type.INTEGER, description: 'Meal total calories' },
                macros: {
                  type: Type.OBJECT,
                  properties: {
                    protein_g: { type: Type.INTEGER },
                    carbs_g: { type: Type.INTEGER },
                    fats_g: { type: Type.INTEGER },
                  },
                  required: ['protein_g', 'carbs_g', 'fats_g'],
                },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      raw_food_item: { type: Type.STRING, description: 'Name of the raw line item (e.g. Yellow Moong Dal (Raw), Low-Fat Paneer)' },
                      food_item: { type: Type.STRING, description: 'Alias for raw food item name' },
                      raw_quantity: { type: Type.NUMBER, description: 'Raw quantity numeric value (e.g. 50, 100, 2)' },
                      unit: { type: Type.STRING, description: 'Unit of measure (e.g. g, ml, eggs, slices)' },
                      portion_label: { type: Type.STRING, description: 'Raw portion display label (e.g. 50g raw, 2 whole eggs)' },
                      portion: { type: Type.STRING, description: 'Portion description' },
                      calories: { type: Type.INTEGER, description: 'Calories for this item portion' },
                      protein_g: { type: Type.NUMBER, description: 'Protein grams for this item portion' },
                      carbs_g: { type: Type.NUMBER, description: 'Carbs grams for this item portion' },
                      fats_g: { type: Type.NUMBER, description: 'Fats grams for this item portion' },
                      suggested_recipe: { type: Type.STRING, description: 'Associated suggested recipe name' },
                      notes: { type: Type.STRING, description: 'Raw prep or kitchen tip' },
                    },
                    required: ['raw_food_item', 'portion_label', 'calories', 'protein_g', 'carbs_g', 'fats_g'],
                  },
                },
              },
              required: ['meal_name', 'target_time', 'suggested_recipe', 'calories', 'macros', 'items'],
            },
          },
        },
        required: ['day_summary', 'meals'],
      };

      const aiResponse = await generateGeminiContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const responseText = aiResponse.text;
      if (!responseText) {
        return res.status(500).json({ error: 'Empty response returned by Gemini model.' });
      }

      const generatedPlanData = JSON.parse(responseText);

      return res.json({
        success: true,
        plan_data: generatedPlanData,
        deterministic_targets: targets,
      });
    } catch (err: any) {
      console.warn('Error generating AI meal plan with Gemini, falling back to deterministic nutrition engine:', err);
      if (req.body?.targets?.calorieTarget && req.body?.targets?.proteinG) {
        try {
          const fallbackPlan = generateDeterministicFallbackMealPlan(req.body.profile, req.body.targets);
          return res.json({
            success: true,
            plan_data: fallbackPlan,
            deterministic_targets: req.body.targets,
            is_fallback: true,
            fallback_notice: 'Generated using Fitkode Sports Nutrition Engine (Gemini AI service experienced high demand).',
          });
        } catch (fbErr: any) {
          console.error('Deterministic meal fallback error:', fbErr);
        }
      }
      return res.status(500).json({
        error: err.message || 'Failed to generate AI meal plan',
      });
    }
  });

  // POST /api/swap-meal
  // Regenerates alternative options for a single specific meal slot matching target macros
  app.post('/api/swap-meal', async (req, res) => {
    try {
      const { mealName, targetCalories, targetProtein, targetCarbs, targetFats, dietaryRestrictions, dislikesAndAllergies } = req.body;

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
      }

      const prompt = `Generate 3 distinct alternative ${mealName || 'meal'} options matching:
- Target Calories: ~${targetCalories || 450} kcal
- Target Protein: ~${targetProtein || 30} g
- Target Carbs: ~${targetCarbs || 50} g
- Target Fats: ~${targetFats || 12} g
- Dietary Restrictions: ${Array.isArray(dietaryRestrictions) ? dietaryRestrictions.join(', ') : 'Vegetarian'}
- Exclude: ${Array.isArray(dislikesAndAllergies) ? dislikesAndAllergies.join(', ') : 'None'}

Every alternative must include raw ingredient weights in grams and Indian kitchen measures.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          alternatives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                calories: { type: Type.INTEGER },
                macros: {
                  type: Type.OBJECT,
                  properties: {
                    protein_g: { type: Type.INTEGER },
                    carbs_g: { type: Type.INTEGER },
                    fats_g: { type: Type.INTEGER },
                  },
                  required: ['protein_g', 'carbs_g', 'fats_g'],
                },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      food_item: { type: Type.STRING },
                      portion: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                    required: ['food_item', 'portion', 'notes'],
                  },
                },
              },
              required: ['title', 'calories', 'macros', 'items'],
            },
          },
        },
        required: ['alternatives'],
      };

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert sports dietitian providing meal swaps that hit exact macro numbers.',
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      return res.json({ success: true, alternatives: parsed.alternatives || [] });
    } catch (err: any) {
      console.error('Error swapping meal:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate meal swap alternatives' });
    }
  });

  // =========================================================================
  // PDF MEAL PLAN INGESTION & RESTRUCTURING WITH ALTERNATE FOODS
  // =========================================================================

  // POST /api/extract-pdf-meal-plan
  // Ingests a PDF (as base64 string), extracts meals, ingredients, quantities, and computes baseline macros
  app.post('/api/extract-pdf-meal-plan', async (req, res) => {
    try {
      const { pdfBase64, fileName, mimeType = 'application/pdf' } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: 'PDF data (base64) is required.' });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          hint: 'Please provide GEMINI_API_KEY in environment secrets.',
        });
      }

      const systemInstruction = `You are a clinical sports nutritionist and document parsing specialist.
Analyze this meal plan PDF document carefully.
Extract all meals, food items, portion sizes, and calculate or read their nutritional values (calories, protein, carbs, fats).
If exact calories or macros are not explicitly written in the PDF, estimate them accurately based on standard Indian & global nutritional food composition tables.
Maintain the exact meal structure (e.g. Breakfast, Lunch, Evening Snack, Dinner, Pre-workout, Post-workout).
Determine the likely diet type (e.g. Vegetarian, Eggetarian, Non-Vegetarian, Vegan).
Return the result strictly conforming to the requested JSON schema.`;

      const prompt = `Carefully inspect and parse this meal plan PDF (${fileName || 'meal-plan.pdf'}).
Extract:
1. Overall summary: total calories, protein (g), carbs (g), fats (g), diet type, and detected patient/client name or goal if present.
2. Every meal slot: name, suggested timing, total slot calories, protein, carbs, fats.
3. Every food item in each meal: name, raw/cooked portion quantity and measure (e.g. "2 rotis", "100g paneer", "1 cup dal"), calories, protein, carbs, fats, and any notes/instructions mentioned.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          plan_name: { type: Type.STRING, description: 'Title or summary of the extracted plan' },
          client_name: { type: Type.STRING, description: 'Client name if mentioned in PDF, else empty' },
          diet_type: { type: Type.STRING, description: 'Vegetarian, Eggetarian, Non-Vegetarian, or Vegan' },
          detected_notes: { type: Type.STRING, description: 'Any instructions, hydration, timing or supplement notes in PDF' },
          total_summary: {
            type: Type.OBJECT,
            properties: {
              total_calories: { type: Type.INTEGER },
              protein_g: { type: Type.INTEGER },
              carbs_g: { type: Type.INTEGER },
              fats_g: { type: Type.INTEGER },
            },
            required: ['total_calories', 'protein_g', 'carbs_g', 'fats_g'],
          },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                meal_name: { type: Type.STRING },
                target_time: { type: Type.STRING },
                calories: { type: Type.INTEGER },
                protein_g: { type: Type.INTEGER },
                carbs_g: { type: Type.INTEGER },
                fats_g: { type: Type.INTEGER },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      food_item: { type: Type.STRING },
                      portion: { type: Type.STRING },
                      calories: { type: Type.INTEGER },
                      protein_g: { type: Type.INTEGER },
                      carbs_g: { type: Type.INTEGER },
                      fats_g: { type: Type.INTEGER },
                      notes: { type: Type.STRING },
                    },
                    required: ['food_item', 'portion', 'calories', 'protein_g', 'carbs_g', 'fats_g'],
                  },
                },
              },
              required: ['meal_name', 'target_time', 'calories', 'protein_g', 'carbs_g', 'fats_g', 'items'],
            },
          },
        },
        required: ['plan_name', 'diet_type', 'total_summary', 'meals'],
      };

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            inlineData: {
              data: pdfBase64,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      return res.json({ success: true, extractedPlan: parsed });
    } catch (err: any) {
      console.error('Error extracting PDF meal plan:', err);
      return res.status(500).json({ error: err.message || 'Failed to parse and extract meal plan from PDF' });
    }
  });

  // POST /api/restructure-pdf-meal-plan
  // Restructures the extracted PDF meal plan under the exact same macro/calorie restrictions using chosen food alternatives
  // Strictly enforces disclosed medical conditions, food allergies, and gut sensitivities
  app.post('/api/restructure-pdf-meal-plan', async (req, res) => {
    try {
      const {
        originalPlan,
        preferredFoods,
        dislikedFoods,
        dietaryRestrictions,
        customInstructions,
        userMedicalHistory,
        foodAllergies,
      } = req.body;

      if (!originalPlan || !originalPlan.total_summary) {
        return res.status(400).json({ error: 'Original plan summary is required.' });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
      }

      const origCalories = originalPlan.total_summary.total_calories || 1800;
      const origProtein = originalPlan.total_summary.protein_g || 100;
      const origCarbs = originalPlan.total_summary.carbs_g || 200;
      const origFats = originalPlan.total_summary.fats_g || 50;

      const preferredFoodsStr = Array.isArray(preferredFoods) && preferredFoods.length > 0
        ? preferredFoods.join(', ')
        : (typeof preferredFoods === 'string' && preferredFoods.trim() ? preferredFoods : 'None specified');

      const dislikedFoodsStr = Array.isArray(dislikedFoods) && dislikedFoods.length > 0
        ? dislikedFoods.join(', ')
        : (typeof dislikedFoods === 'string' && dislikedFoods.trim() ? dislikedFoods : 'None specified');

      const dietaryRestrictionsStr = Array.isArray(dietaryRestrictions) && dietaryRestrictions.length > 0
        ? dietaryRestrictions.join(', ')
        : (originalPlan.diet_type || 'Vegetarian');

      const medicalHistoryStr = userMedicalHistory && typeof userMedicalHistory === 'string' && userMedicalHistory.trim()
        ? userMedicalHistory.trim()
        : 'No adverse medical history reported';

      const allergiesStr = Array.isArray(foodAllergies) && foodAllergies.length > 0
        ? foodAllergies.join(', ')
        : (typeof foodAllergies === 'string' && foodAllergies.trim() ? foodAllergies.trim() : 'None reported');

      const systemInstruction = `You are an elite sports clinical dietitian and macronutrient specialist.
Your task is to RESTRUCTURE a person's existing meal plan by swapping food items for their preferred alternatives, while STRICTLY locking in the exact same caloric and macronutrient restrictions (+/- 3% margin).

STRICT CLINICAL & NUTRITIONAL SAFETY DIRECTIVES:
1. MANDATORY MEDICAL CHECK: Disclosed Medical Conditions / History: "${medicalHistoryStr}". Disclosed Food Allergies / Intolerances: "${allergiesStr}".
2. NEVER suggest any food item or ingredient that directly conflicts with or triggers their disclosed food allergies or medical conditions, EVEN IF THE USER LISTED IT IN THEIR PREFERRED FOODS.
   - For example: If allergic to peanuts/nuts, never include peanut butter, almonds, or nut oils.
   - If lactose intolerant, do not include whole cow's milk or regular whey concentrate; use lactose-free milk, plant milk, or whey isolate.
   - If hypertensive, avoid high-sodium processed foods or pickles.
   - If diabetic, avoid refined sugars, high GI syrups, or fruit juice concentrates.
3. If the user explicitly requested a preferred item that could potentially aggravate or impact their health condition, or if an item requires cautionary use:
   - YOU MUST attach a clear medical warning in the item's "medical_warning" field explaining: "Using this item is not recommended or requires extreme caution as it is counterproductive to your health goals and may directly impact your medical conditions [specify exact condition/allergy]."
4. Target Daily Calories: EXACTLY ~${origCalories} kcal (error margin +/- 40 kcal).
5. Target Protein: EXACTLY ~${origProtein} g (error margin +/- 5g).
6. Target Carbs: EXACTLY ~${origCarbs} g (error margin +/- 8g).
7. Target Fats: EXACTLY ~${origFats} g (error margin +/- 4g).
8. Incorporate the user's PREFERRED alternate food items: "${preferredFoodsStr}" (subject to medical safety above).
9. STRICTLY REMOVE/EXCLUDE all disliked foods or items to replace: "${dislikedFoodsStr}".
10. Respect dietary restriction: "${dietaryRestrictionsStr}".
11. Every new ingredient must provide clear raw gram weights and household kitchen measures (e.g., "120g low-fat paneer", "2 medium chapatis (~60g atta)", "1.5 katori cooked yellow dal", "30g whey isolate").
12. Distribute the macros across the meals matching the relative proportions of the original plan.
13. If any warnings were triggered, list them in the top-level "medical_safety_warnings" array.`;

      const prompt = `Restructure the following meal plan:
Original Summary:
- Calories: ${origCalories} kcal
- Protein: ${origProtein} g
- Carbs: ${origCarbs} g
- Fats: ${origFats} g
- Current Meals:
${(originalPlan.meals || []).map((m: any) => `  * ${m.meal_name} (${m.target_time}): ~${m.calories} kcal, P:${m.protein_g}g, C:${m.carbs_g}g, F:${m.fats_g}g. Current items: ${(m.items || []).map((it: any) => `${it.food_item} (${it.portion})`).join(', ')}`).join('\n')}

USER CUSTOMIZATION REQUEST:
- Swap with Preferred Alternatives: ${preferredFoodsStr}
- Exclude/Replace: ${dislikedFoodsStr}
- Dietary Filter: ${dietaryRestrictionsStr}
${customInstructions ? `- Specific Directives: ${customInstructions}` : ''}

CLIENT DISCLOSED MEDICAL PROFILE (SAFETY PRIORITY):
- Disclosed Food Allergies & Intolerances: ${allergiesStr}
- Disclosed Past Surgeries & Medical Conditions: ${medicalHistoryStr}

Generate the restructured, macro-matched replacement meal plan with exact measurements and mandatory medical safety validation.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          restructured_title: { type: Type.STRING },
          diet_type: { type: Type.STRING },
          day_summary: {
            type: Type.OBJECT,
            properties: {
              total_calories: { type: Type.INTEGER },
              total_protein_g: { type: Type.INTEGER },
              total_carbs_g: { type: Type.INTEGER },
              total_fats_g: { type: Type.INTEGER },
              macro_variance_notes: { type: Type.STRING, description: 'Comparison showing how accurately it matched original targets' },
            },
            required: ['total_calories', 'total_protein_g', 'total_carbs_g', 'total_fats_g'],
          },
          medical_safety_warnings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of specific medical or allergy warnings against any requested items that could impact disclosed health conditions',
          },
          swaps_applied_summary: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of specific food substitutions made (e.g. "Replaced oats with paneer bhurji toast")',
          },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                meal_name: { type: Type.STRING },
                target_time: { type: Type.STRING },
                calories: { type: Type.INTEGER },
                protein_g: { type: Type.INTEGER },
                carbs_g: { type: Type.INTEGER },
                fats_g: { type: Type.INTEGER },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      food_item: { type: Type.STRING },
                      portion: { type: Type.STRING },
                      calories: { type: Type.INTEGER },
                      protein_g: { type: Type.INTEGER },
                      carbs_g: { type: Type.INTEGER },
                      fats_g: { type: Type.INTEGER },
                      notes: { type: Type.STRING },
                      medical_warning: {
                        type: Type.STRING,
                        description: 'Caution or warning if item impacts medical condition or requires restriction',
                      },
                    },
                    required: ['food_item', 'portion', 'calories', 'protein_g', 'carbs_g', 'fats_g'],
                  },
                },
              },
              required: ['meal_name', 'target_time', 'calories', 'protein_g', 'carbs_g', 'fats_g', 'items'],
            },
          },
        },
        required: ['restructured_title', 'diet_type', 'day_summary', 'swaps_applied_summary', 'meals'],
      };

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      return res.json({ success: true, restructuredPlan: parsed });
    } catch (err: any) {
      console.error('Error restructuring meal plan:', err);
      return res.status(500).json({ error: err.message || 'Failed to restructure meal plan' });
    }
  });

  // POST /api/generate-workout-plan: Formulates a progressive training split using Gemini AI
  app.post('/api/generate-workout-plan', async (req, res) => {
    try {
      const {
        memberEmail,
        memberName,
        goal = 'Hypertrophy & Muscle Gain',
        difficulty = 'Intermediate',
        daysPerWeek = 4,
        splitPreference = 'Push / Pull / Legs',
        gymAccess = 'yes',
        equipmentAvailable = 'Commercial Gym with Barbells, Dumbbells, Cables, and Machines',
        limitationsAndInjuries = '',
        isCoachMode = false,
      } = req.body;

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
          hint: 'Please provide GEMINI_API_KEY in environment secrets.',
        });
      }

      const systemInstruction = `You are an elite clinical sports performance scientist and Certified Strength & Conditioning Specialist (CSCS) for the Fitkode coaching platform under head coach Chinmay Jain.
Your role is to formulate a periodized, progressive resistance and conditioning training split program tailored to the user's specific goal, schedule, equipment, and medical/physical limitations.

Strict Rules:
1. Formulate a program with 7 total days in the weekly schedule. Exactly ${daysPerWeek} days must be active training days (is_rest_day: false), and (7 - ${daysPerWeek}) days must be rest or active recovery days (is_rest_day: true).
2. For training days (is_rest_day: false), prescribe 4 to 6 evidence-based exercises targeting the designated day's focus with balanced compound and isolation volume.
3. For rest days (is_rest_day: true), set focus to "Rest & Active Recovery" or "Mobility & Cardiovascular Conditioning", with empty exercises array or 2 light mobility drill items.
4. Exercise names must be standard, recognizable resistance movements (e.g. "Barbell Incline Bench Press", "Romanian Deadlift", "Lat Pulldown (Neutral Grip)", "Bulgarian Split Squats", "Standing Dumbbell Lateral Raise").
5. Rep ranges must match the goal (e.g. 6-8 for Strength, 8-12 for Hypertrophy, 12-15 for Conditioning/Fat Loss).
6. Rest periods must be realistic (60-120 seconds).
7. If the user disclosed injuries, surgeries, or limitations (${limitationsAndInjuries || 'None declared'}), strictly select joint-friendly movements that do NOT contraindicate their condition. Explicitly provide technique cues or safety notes.
8. Output must adhere strictly to the JSON schema.`;

      const prompt = `Formulate a comprehensive weekly workout routine for:
- Member Name: ${memberName || 'Member'}
- Fitness Goal: ${goal}
- Experience Level: ${difficulty}
- Days Per Week: ${daysPerWeek}
- Split Preference: ${splitPreference}
- Gym Access / Equipment: ${gymAccess === 'no' ? 'Home / Bodyweight / Minimal Equipment' : equipmentAvailable}
- Medical Disclosures / Limitations / Injuries: ${limitationsAndInjuries || 'None declared'}

Provide an expertly periodized program with exercise cues, sets, reps, and rest intervals.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          plan_name: { type: Type.STRING, description: 'Descriptive name for the workout regimen' },
          goal: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          days_per_week: { type: Type.INTEGER },
          coach_notes: { type: Type.STRING, description: 'Clinical coaching notes on progressive overload, warmup, and execution' },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day_name: { type: Type.STRING, description: 'e.g. Day 1: Push (Chest, Shoulders & Triceps) or Monday - Push' },
                is_rest_day: { type: Type.BOOLEAN },
                focus: { type: Type.STRING, description: 'e.g. Upper Push Hypertrophy or Rest & Active Recovery' },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      target_muscle: { type: Type.STRING, description: 'e.g. Chest, Back, Quads, Shoulders, Hamstrings, Core, etc.' },
                      sets: { type: Type.INTEGER },
                      reps: { type: Type.STRING, description: 'e.g. 8-12, 6-8, 12-15, 30-45s' },
                      rest_seconds: { type: Type.INTEGER },
                      notes: { type: Type.STRING, description: 'Form cues, tempo, or safety instructions' },
                    },
                    required: ['name', 'target_muscle', 'sets', 'reps', 'rest_seconds', 'notes'],
                  },
                },
              },
              required: ['day_name', 'is_rest_day', 'focus', 'exercises'],
            },
          },
        },
        required: ['plan_name', 'goal', 'difficulty', 'days_per_week', 'coach_notes', 'days'],
      };

      const aiResponse = await generateGeminiContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const responseText = aiResponse.text;
      if (!responseText) {
        return res.status(500).json({ error: 'Empty response returned by Gemini model.' });
      }

      const generatedData = JSON.parse(responseText);
      return res.json({
        success: true,
        plan_data: generatedData,
      });
    } catch (err: any) {
      console.warn('Error generating workout plan with Gemini, falling back to deterministic kinesiology engine:', err);
      try {
        const fallbackWorkoutPlan = generateDeterministicFallbackWorkoutPlan(req.body);
        return res.json({
          success: true,
          plan_data: fallbackWorkoutPlan,
          is_fallback: true,
          fallback_notice: 'Generated using Fitkode Kinesiology Exercise Engine (Gemini AI service experienced high demand).',
        });
      } catch (fbErr: any) {
        console.error('Deterministic workout fallback error:', fbErr);
      }
      return res.status(500).json({
        error: err.message || 'Failed to generate workout regimen with Gemini.',
      });
    }
  });

  // =========================================================================
  // WORKOUT PLANS ENDPOINTS (Cross-Device Sync)
  // =========================================================================

  // GET /api/workout-plans: Fetch workout plans
  app.get('/api/workout-plans', (req, res) => {
    const userEmail = (req.query.userEmail as string || '').toLowerCase().trim();
    if (userEmail) {
      const filtered = serverWorkoutPlans.filter(
        (p) => (p.userEmail && p.userEmail.toLowerCase().trim() === userEmail) ||
               (p.userId && p.userId.toLowerCase().trim() === userEmail)
      );
      return res.json({ success: true, plans: filtered });
    }
    return res.json({ success: true, plans: serverWorkoutPlans });
  });

  // POST /api/workout-plans: Save or sync workout plans
  app.post('/api/workout-plans', (req, res) => {
    try {
      const incoming = req.body;
      const plansToSync: any[] = Array.isArray(incoming) ? incoming : (incoming?.plans || [incoming]);

      plansToSync.forEach((plan) => {
        if (!plan || !plan.id) return;
        const idx = serverWorkoutPlans.findIndex((p) => p.id === plan.id);
        if (idx >= 0) {
          serverWorkoutPlans[idx] = { ...serverWorkoutPlans[idx], ...plan, updatedAt: new Date().toISOString() };
        } else {
          serverWorkoutPlans.unshift({ ...plan, updatedAt: new Date().toISOString() });
        }
      });
      persistWorkoutPlans();
      return res.json({ success: true, plans: serverWorkoutPlans });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to save workout plans' });
    }
  });

  // =========================================================================
  // CONTACT & CONSULTATION INQUIRY ENDPOINT
  // =========================================================================

  // POST /api/contact: Handles consultation inquiry form submissions and alerts coach
  app.post('/api/contact', async (req, res) => {
    try {
      const { firstName, lastName, email, phone, goal, code } = req.body;
      const cleanEmail = (email || '').toLowerCase().trim();
      const cleanName = `${firstName || ''} ${lastName || ''}`.trim() || cleanEmail.split('@')[0] || 'Inquirer';
      const cleanPhone = `${code || '+91'} ${phone || ''}`.trim();

      if (!cleanEmail) {
        return res.status(400).json({ error: 'Email address is required.' });
      }

      // Add or update inquiry in serverMembers so Coach can see them immediately in Admin Portal!
      const existingIdx = serverMembers.findIndex((m) => m.email.toLowerCase() === cleanEmail);
      if (existingIdx >= 0) {
        serverMembers[existingIdx].notes = `[Consultation Request]: Goal: ${goal || 'Not specified'}. Phone: ${cleanPhone}. Date: ${new Date().toLocaleDateString()}.\n\n` + (serverMembers[existingIdx].notes || '');
        serverMembers[existingIdx].phone = cleanPhone || serverMembers[existingIdx].phone;
      } else {
        serverMembers.unshift({
          id: `lead_${Date.now()}`,
          email: cleanEmail,
          name: cleanName,
          role: 'unpaid',
          phone: cleanPhone,
          planName: 'Consultation Requested',
          joinedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          profileCompletion: 25,
          onboardingCompletion: 10,
          notes: `[Consultation Request]: Goal: ${goal || 'Not specified'}. Phone: ${cleanPhone}. Submitted on ${new Date().toLocaleDateString()}`,
        });
      }
      persistMembers();

      // Dispatch email to Coach Chinmay
      try {
        const coachEmail = process.env.COACH_NOTIFICATION_EMAIL || 'myfitkode@gmail.com';
        await sendEmailNotification({
          type: 'consultation_inquiry',
          to: coachEmail,
          subject: `⚡ New Consultation Request: ${cleanName} (${cleanPhone})`,
          previewText: `New coaching lead from ${cleanName}: ${goal ? goal.slice(0, 80) : ''}...`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #15803d; margin-top: 0;">New Consultation Request Received!</h2>
              <p>A new potential client has submitted the consultation form on Fitkode:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; font-weight: bold; width: 140px;">Name:</td><td style="padding: 8px;">${cleanName}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${cleanEmail}">${cleanEmail}</a></td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Phone / WhatsApp:</td><td style="padding: 8px;">${cleanPhone}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Fitness Goal:</td><td style="padding: 8px; background: #f9fafb; border-radius: 6px;">${goal || 'Not specified'}</td></tr>
              </table>
              <p style="color: #6b7280; font-size: 13px;">This client has been added to your Admin Portal under Unpaid / Leads.</p>
            </div>
          `,
          text: `New consultation request from ${cleanName} (${cleanEmail}, ${cleanPhone}). Goal: ${goal}`,
          recipientName: 'Coach Chinmay',
        });
      } catch (emailErr) {
        console.warn('Consultation email notification notice:', emailErr);
      }

      return res.json({ success: true, message: 'Consultation request received successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to process consultation request.' });
    }
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

      // Ensure notified weekly entry is also saved into server repository
      if (entry.id) {
        const existingIdx = serverWeeklyEntries.findIndex((e) => e.id === entry.id);
        const entryToSave = { ...entry, userEmail, updatedAt: new Date().toISOString() };
        if (existingIdx >= 0) {
          serverWeeklyEntries[existingIdx] = entryToSave;
        } else {
          serverWeeklyEntries.unshift(entryToSave);
        }
        persistWeeklyEntries();
      }

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

  // Track emails sent to avoid duplicate welcome emails on continuous reloads
  const sentWelcomeEmails = new Set<string>();

  // POST /api/communication/notify-welcome
  // Dispatches energetic Welcome to Fitkode email when a member logs in with Gmail
  app.post('/api/communication/notify-welcome', async (req, res) => {
    try {
      const { email, name, force = false } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required to dispatch welcome notification.' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if already dispatched in this session and not forced
      if (!force && sentWelcomeEmails.has(normalizedEmail)) {
        return res.json({ success: true, alreadySent: true });
      }

      const member = serverMembers.find((m) => m.email.toLowerCase().trim() === normalizedEmail);
      const recipientName = name || member?.name || normalizedEmail.split('@')[0];
      const appUrl = process.env.APP_URL || (req.headers.origin as string) || `http://${req.headers.host}`;

      const { subject, html, text, previewText } = buildWelcomeEmail({
        targetEmail: normalizedEmail,
        clientName: recipientName,
        appUrl,
      });

      const result = await sendEmailNotification({
        type: 'welcome_email',
        to: normalizedEmail,
        subject,
        previewText,
        html,
        text,
        recipientName,
        metadata: {
          authProvider: 'google',
          clientEmail: normalizedEmail,
          clientName: recipientName,
        },
      });

      sentWelcomeEmails.add(normalizedEmail);
      return res.json({ success: true, log: result.log });
    } catch (err: any) {
      console.error('Error in notify-welcome endpoint:', err);
      return res.status(500).json({ error: err?.message || 'Failed to dispatch welcome notification' });
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
