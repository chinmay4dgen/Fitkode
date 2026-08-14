import React, { useState, useEffect } from 'react';
import { ActivityLevel, TDEEInput, MacroSplit } from '../types';
import { Dumbbell, Scale, Flame, Sparkles, AlertCircle, TrendingDown, TrendingUp, Sparkle, ArrowRight, UserCheck } from 'lucide-react';
import Seo from './Seo';

interface FitnessToolsProps {
  focusedTool?: 'bmi' | 'tdee' | 'macro';
}

export default function FitnessTools({ focusedTool }: FitnessToolsProps) {
  // BMI Calculator States
  const [bmiWeight, setBmiWeight] = useState(75); // kg
  const [bmiHeight, setBmiHeight] = useState(178); // cm
  const [bmiValue, setBmiResult] = useState(23.67);
  const [bmiCategory, setBmiCategory] = useState('Normal');

  // TDEE States
  const [tdeeInput, setTdeeInput] = useState<TDEEInput>({
    age: 32,
    gender: 'male',
    weight: 78,
    height: 178,
    activity: 'moderately-active',
  });
  const [tdeeValue, setTdeeResult] = useState(2650);

  // Macros States
  const [macroCalories, setMacroCalorieInput] = useState(2650);
  const [macroGoal, setMacroGoal] = useState<'shred' | 'lean' | 'bulk'>('lean');
  const [macrosResult, setMacrosResult] = useState<MacroSplit>({ protein: 165, carbs: 298, fats: 88 });

  // 1. BMI Calculation
  useEffect(() => {
    if (bmiHeight > 0 && bmiWeight > 0) {
      const heightInMeters = bmiHeight / 100;
      const b = Number((bmiWeight / (heightInMeters * heightInMeters)).toFixed(2));
      setBmiResult(b);

      if (b < 18.5) {
        setBmiCategory('Underweight');
      } else if (b >= 18.5 && b < 25) {
        setBmiCategory('Normal weight');
      } else if (b >= 25 && b < 30) {
        setBmiCategory('Overweight');
      } else {
        setBmiCategory('Obese');
      }
    }
  }, [bmiWeight, bmiHeight]);

  // 2. TDEE Calculation (Mifflin-St Jeor Formula)
  useEffect(() => {
    const { age, gender, weight, height, activity } = tdeeInput;
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers: Record<ActivityLevel, number> = {
      'sedentary': 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extra-active': 1.9,
    };

    const multiplier = activityMultipliers[activity] || 1.2;
    const tResult = Math.round(bmr * multiplier);
    setTdeeResult(tResult);
  }, [tdeeInput]);

  // 3. Macro Split Calculation
  useEffect(() => {
    // Shredding: 35% P, 35% C, 30% F
    // Lean Maintain: 30% P, 40% C, 30% F
    // Bulking: 25% P, 50% C, 25% F
    let pPct = 0.3;
    let cPct = 0.4;
    let fPct = 0.3;

    if (macroGoal === 'shred') {
      pPct = 0.35;
      cPct = 0.35;
      fPct = 0.3;
    } else if (macroGoal === 'bulk') {
      pPct = 0.25;
      cPct = 0.5;
      fPct = 0.25;
    }

    const pKcal = macroCalories * pPct;
    const cKcal = macroCalories * cPct;
    const fKcal = macroCalories * fPct;

    setMacrosResult({
      protein: Math.round(pKcal / 4),
      carbs: Math.round(cKcal / 4),
      fats: Math.round(fKcal / 9),
    });
  }, [macroCalories, macroGoal]);

  // Coach advice generation logic based on user inputs
  const getCoachAdvice = () => {
    const activeLevelText = {
      'sedentary': 'mainly desk-bound or inactive',
      'lightly-active': 'active 1-2 times a week',
      'moderately-active': 'working out 3-5 times a week',
      'very-active': 'engaging in intense physical workloads',
      'extra-active': 'highly intense athletic routines',
    }[tdeeInput.activity];

    if (macroGoal === 'shred') {
      return {
        title: 'High-Converting Fat Loss Strategy',
        target: `${Math.round(macroCalories - 450)} kcal/day`,
        deficit: '450 kcal deficit applied',
        text: `Since your goal is Fat Loss/Shred, Coach Chinmay suggests applying a steady 400-500 kcal deficit. We have calculated your safe target calorie intake. Notice that we keep protein elevated at ${macrosResult.protein}g to preserve lean physical tissue while mobilising fat. You will still eat ${macrosResult.carbs}g of carbs daily—zero starvation or low-carb fatigue required.`,
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
        recoPlan: '3 Months Plan - Fitness Fundamentals'
      };
    } else if (macroGoal === 'bulk') {
      return {
        title: 'Controlled Lean Muscular Bulk',
        target: `${Math.round(macroCalories + 300)} kcal/day`,
        deficit: '300 kcal surplus applied',
        text: `To construct clean natural physical size, Coach Chinmay suggests a mild, clean caloric surplus of 200-300 kcal. This feeds muscular hypertrophy without unnecessary fat storage. Your protein target of ${macrosResult.protein}g is fully supported by a high-energy intake of ${macrosResult.carbs}g of clean carbohydrates, ensuring deep cellular recovery and premium joint lubrication from healthy essential fats.`,
        icon: <TrendingUp className="h-5 w-5 text-brand-green" />,
        recoPlan: '6 Months Plan - Comprehensive'
      };
    } else {
      return {
        title: 'Metabolic Optimization & Recomp',
        target: `${macroCalories} kcal/day`,
        deficit: 'Eucaloric maintenance baseline',
        text: `You are set for Lean Maintenance/Body Recomposition. This protocol focuses on simultaneous fat-loss and muscular tone. Since your activity is ${activeLevelText}, maintaining ${macroCalories} calories with ${macrosResult.protein}g of clean protein will systematically re-condition your insulin sensitivity, restore restful sleep patterns, and build metabolic stamina.`,
        icon: <Sparkle className="h-5 w-5 text-amber-500" />,
        recoPlan: 'Annual Plan - Longevity & Habits Builder'
      };
    }
  };

  const advice = getCoachAdvice();

  let seoTitle = 'Free Fitness Calculators — BMI, TDEE, Macros | Fitkode';
  let seoDesc = 'Evidence-based calculators for body mass index, daily energy expenditure and macronutrient splits, built for Indian diets and real schedules.';
  let seoCanonical = '/tools';

  if (focusedTool === 'bmi') {
    seoTitle = 'BMI Calculator for Indian Adults — Free | Fitkode';
    seoDesc = 'Calculate your BMI instantly and see what the number actually means for Indian body composition, plus the metrics that matter more than BMI.';
    seoCanonical = '/tools/bmi-calculator';
  } else if (focusedTool === 'tdee') {
    seoTitle = 'TDEE Calculator — Daily Calorie Needs | Fitkode';
    seoDesc = 'Find your maintenance calories with the Mifflin-St Jeor formula, adjusted for your real activity level, then split them into protein, carbs and fats.';
    seoCanonical = '/tools/tdee-calculator';
  } else if (focusedTool === 'macro') {
    seoTitle = 'Macro Calculator for Fat Loss & Muscle | Fitkode';
    seoDesc = 'Split your calories into protein, carbs and fats for fat loss, maintenance or muscle gain — with guidance for vegetarian Indian meals.';
    seoCanonical = '/tools/macro-calculator';
  }

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": seoTitle,
    "url": `https://fitkode.com${seoCanonical}`,
    "applicationCategory": "HealthApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-left">
      <Seo 
        title={seoTitle}
        description={seoDesc}
        canonicalPath={seoCanonical}
        schema={webAppSchema}
      />
      
      {/* Upper Description Header */}
      <div className="text-center space-y-3 bg-white rounded-3xl p-8 md:p-10 border border-brand-light-green shadow-sm max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-brand-green bg-brand-light-green/50">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" /> SCIENTIFIC DIAGNOSTIC UTILITIES
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-brand-dark-green tracking-tight">
          Evidence-Based Fitness Calculators
        </h1>
        <p className="text-xs text-gray-550 max-w-xl mx-auto leading-relaxed">
          At Fitkode, we reject guesswork. Use our physical intelligence tools to calculate your precise Body Mass Index (BMI), Maintenance Energy (TDEE), and structured macronutrient balances to begin your transformation.
        </p>
      </div>

      {/* Main Dual Column Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
        
        {/* 1. BMI Dashboard Calculator */}
        <div className="bg-white p-6 rounded-2xl border border-brand-light-green shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-light-green/50 text-brand-green rounded-xl">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-brand-dark-green text-base">Body Mass Index (BMI)</h3>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Track relative physical density</p>
            </div>
          </div>

          <div className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-brand-dark-green">
                <span>Height: {bmiHeight} cm</span>
                <span className="text-gray-400 font-mono">140 - 220 cm</span>
              </div>
              <input 
                type="range"
                min="140"
                max="220"
                value={bmiHeight}
                onChange={(e) => setBmiHeight(Number(e.target.value))}
                className="w-full accent-brand-green bg-gray-100 rounded-lg appearance-none h-2"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-brand-dark-green">
                <span>Weight: {bmiWeight} kg</span>
                <span className="text-gray-400 font-mono">40 - 150 kg</span>
              </div>
              <input 
                type="range"
                min="40"
                max="150"
                value={bmiWeight}
                onChange={(e) => setBmiWeight(Number(e.target.value))}
                className="w-full accent-brand-green bg-gray-100 rounded-lg appearance-none h-2"
              />
            </div>
          </div>

          {/* BMI Result dial */}
          <div className="bg-brand-light-green/30 rounded-xl p-5 border border-brand-green/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-brand-green font-bold uppercase tracking-wider">Estimated BMI Value</p>
              <h4 className="text-3xl font-black text-brand-dark-green font-display">{bmiValue}</h4>
            </div>
            <div className="text-right space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-brand-dark-green bg-white px-3 py-1.5 rounded-lg shadow-xs border border-brand-light-green inline-block">
                {bmiCategory}
              </span>
              <p className="text-[9px] text-gray-400 font-semibold block uppercase">Healthy: 18.5 - 24.9</p>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed italic text-center">
            *BMI is a primary screening metric. Under personalized coaching, we also track waist-to-hip ratio, skin-fold calipers, and subjective biofeedback parameters.
          </p>
        </div>

        {/* 2. TDEE (Calorie Calc) */}
        <div className="bg-white p-6 rounded-2xl border border-brand-light-green shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-light-green/50 text-brand-green rounded-xl">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-brand-dark-green text-base">Daily Energy Expenditure (TDEE)</h3>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Discover daily thermodynamic maintenance</p>
            </div>
          </div>

          {/* TDEE Inputs */}
          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-brand-dark-green">
            <div>
              <label className="block mb-1 font-bold text-gray-500 uppercase tracking-wide text-[9px]">Age (Years)</label>
              <input 
                type="number" 
                value={tdeeInput.age}
                onChange={(e) => setTdeeInput({ ...tdeeInput, age: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg focus:outline-none focus:border-brand-green font-semibold"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-gray-500 uppercase tracking-wide text-[9px]">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTdeeInput({ ...tdeeInput, gender: 'male' })}
                  type="button"
                  className={`py-2 rounded-lg border font-bold text-xs transition-all ${
                    tdeeInput.gender === 'male' 
                      ? 'border-brand-green text-brand-green bg-brand-light-green/35' 
                      : 'border-brand-light-green text-gray-400 bg-white hover:bg-gray-50'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setTdeeInput({ ...tdeeInput, gender: 'female' })}
                  type="button"
                  className={`py-2 rounded-lg border font-bold text-xs transition-all ${
                    tdeeInput.gender === 'female' 
                      ? 'border-brand-green text-brand-green bg-brand-light-green/35' 
                      : 'border-brand-light-green text-gray-400 bg-white hover:bg-gray-50'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-bold text-gray-500 uppercase tracking-wide text-[9px]">Height (cm)</label>
              <input 
                type="number" 
                value={tdeeInput.height}
                onChange={(e) => setTdeeInput({ ...tdeeInput, height: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg focus:outline-none focus:border-brand-green font-semibold"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-gray-500 uppercase tracking-wide text-[9px]">Weight (kg)</label>
              <input 
                type="number" 
                value={tdeeInput.weight}
                onChange={(e) => setTdeeInput({ ...tdeeInput, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg focus:outline-none focus:border-brand-green font-semibold"
              />
            </div>

            <div className="col-span-2">
              <label className="block mb-1 font-bold text-gray-500 uppercase tracking-wide text-[9px]">Activity Level</label>
              <select
                value={tdeeInput.activity}
                onChange={(e) => setTdeeInput({ ...tdeeInput, activity: e.target.value as ActivityLevel })}
                className="w-full px-3 py-2 border border-brand-light-green bg-white rounded-lg focus:outline-none focus:border-brand-green text-xs font-semibold"
              >
                <option value="sedentary">Sedentary (Office desk job / no exercise)</option>
                <option value="lightly-active">Light Active (Easy workout 1-2 days/week)</option>
                <option value="moderately-active">Moderately Active (Smart workouts 3-5 days/week)</option>
                <option value="very-active">Very Active (Heavy resistance prep 6-7 days/week)</option>
                <option value="extra-active">Extra Active (Professional athlete / construction workload)</option>
              </select>
            </div>
          </div>

          {/* TDEE results badge */}
          <div className="bg-brand-light-green/30 rounded-xl p-5 border border-brand-green/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-brand-green font-bold uppercase tracking-wider">Estimated TDEE Baseline</p>
              <h4 className="text-2xl font-black text-brand-dark-green font-mono">{tdeeValue} <span className="text-[10px] text-gray-400 font-bold uppercase">kcal/day</span></h4>
            </div>
            
            <button
              onClick={() => setMacroCalorieInput(tdeeValue)}
              className="text-[10px] font-bold text-white uppercase bg-brand-green px-4 py-2.5 rounded-lg shadow hover:bg-brand-dark-green transition-all"
            >
              Apply to Splitter
            </button>
          </div>
        </div>

      </div>

      {/* 3. Macros Distributor Dashboard */}
      <section className="bg-white rounded-3xl border border-brand-light-green p-6 md:p-8 shadow-sm space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-light-green/50 text-brand-green rounded-xl">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-brand-dark-green text-base">Scientific Macro-Nutrient Splitter</h3>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Organize daily proteins, carbs, and fats correctly</p>
            </div>
          </div>

          {/* Target energy calibration */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-dark-green font-mono">Calorie Baseline:</span>
            <input 
              type="number"
              value={macroCalories}
              onChange={(e) => setMacroCalorieInput(Number(e.target.value))}
              className="w-24 px-2.5 py-1.5 bg-white border border-brand-light-green rounded-lg text-xs font-bold font-mono text-center focus:outline-none focus:border-brand-green"
            />
            <span className="text-[10px] text-gray-450 font-bold uppercase">kcal</span>
          </div>
        </div>

        {/* Dynamic Goal Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
          <button
            onClick={() => setMacroGoal('shred')}
            type="button"
            className={`py-4 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
              macroGoal === 'shred' 
                ? 'border-brand-green text-brand-green bg-brand-light-green/40 shadow-xs' 
                : 'border-brand-light-green text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-1.5">🏃 Fat Loss / Shred</span>
            <span className="text-[9px] text-gray-400 font-medium font-mono">35% Protein | 35% Carbs | 30% Fats</span>
          </button>
          
          <button
            onClick={() => setMacroGoal('lean')}
            type="button"
            className={`py-4 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
              macroGoal === 'lean' 
                ? 'border-brand-green text-brand-green bg-brand-light-green/40 shadow-xs' 
                : 'border-brand-light-green text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-1.5">⚖️ Lean Maintenance</span>
            <span className="text-[9px] text-gray-400 font-medium font-mono">30% Protein | 40% Carbs | 30% Fats</span>
          </button>
          
          <button
            onClick={() => setMacroGoal('bulk')}
            type="button"
            className={`py-4 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
              macroGoal === 'bulk' 
                ? 'border-brand-green text-brand-green bg-brand-light-green/40 shadow-xs' 
                : 'border-brand-light-green text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-1.5">💪 Muscle Bulk</span>
            <span className="text-[9px] text-gray-400 font-medium font-mono">25% Protein | 50% Carbs | 25% Fats</span>
          </button>
        </div>

        {/* Dynamic macro splits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          <div className="bg-brand-light-green/20 rounded-2xl p-6 border border-brand-green/10 text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-green" />
            <span className="text-[10px] text-brand-green uppercase font-bold tracking-widest font-mono">Proteins</span>
            <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">{macrosResult.protein} <span className="text-xs text-gray-400 font-bold uppercase">g</span></h4>
            <p className="text-[11px] text-gray-500 leading-normal">
              Essential for lean muscle building, cellular repair, immunity profiles, and hunger regulation.
            </p>
          </div>

          <div className="bg-brand-light-green/20 rounded-2xl p-6 border border-brand-green/10 text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-natural-clay" />
            <span className="text-[10px] text-natural-clay uppercase font-bold tracking-widest font-mono">Carbohydrates</span>
            <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">{macrosResult.carbs} <span className="text-xs text-gray-400 font-bold uppercase">g</span></h4>
            <p className="text-[11px] text-gray-500 leading-normal">
              Provides critical fuel for heavy lifting, high corporate cognitive stamina, and general cell energy.
            </p>
          </div>

          <div className="bg-brand-light-green/20 rounded-2xl p-6 border border-brand-green/10 text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-natural-dust" />
            <span className="text-[10px] text-natural-dust uppercase font-bold tracking-widest font-mono">Fats</span>
            <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">{macrosResult.fats} <span className="text-xs text-gray-400 font-bold uppercase">g</span></h4>
            <p className="text-[11px] text-gray-500 leading-normal">
              Regulates baseline biological hormones, vitamin absorption channels, and keeps joint tissues lubricated.
            </p>
          </div>

        </div>

        {/* Dynamic Personal Coach Diagnostics Advisor */}
        <div className="bg-natural-oat/60 rounded-2xl border border-brand-light-green p-6 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full pointer-events-none" />
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-green text-white rounded-xl flex-shrink-0">
              <UserCheck className="h-6 w-6" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-brand-green font-extrabold font-mono bg-brand-light-green px-2 py-0.5 rounded">COACH REPORT</span>
                <h4 className="font-display font-extrabold text-brand-dark-green text-lg flex items-center gap-2">
                  {advice.title}
                </h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Calculated Goal Energy Intake: {advice.target} | {advice.deficit}</p>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed italic font-serif">
                "{advice.text}"
              </p>

              <div className="h-[1px] bg-brand-light-green w-full" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">SUGGESTED FITKODE PROGRAM</p>
                  <p className="text-xs font-extrabold text-brand-dark-green">{advice.recoPlan}</p>
                </div>

                <a 
                  href="#plans"
                  onClick={() => {
                    // Navigate to plans-pricing tab if required
                    const navBtn = document.querySelector('button[active-tab="plans-pricing"]');
                    if (navBtn) (navBtn as HTMLButtonElement).click();
                  }}
                  className="px-4 py-2 bg-brand-green hover:bg-brand-dark-green text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 uppercase tracking-wide cursor-pointer"
                >
                  Apply Metrics to Coaching Program <ArrowRight className="h-3 w-3" />
                </a>
              </div>

            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
