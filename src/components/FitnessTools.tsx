import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ActivityLevel, TDEEInput, MacroSplit, BodyFatInput, BodyFatResult } from '../types';
import {
  Dumbbell,
  Scale,
  Flame,
  Sparkles,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Sparkle,
  ArrowRight,
  UserCheck,
  Utensils,
  Percent,
  CheckCircle2,
  BookOpen,
  Info,
  ChevronRight,
  Activity,
  RotateCcw,
  Zap,
} from 'lucide-react';
import Seo from './Seo';
import {
  calculateUSNavyBodyFat,
  calculateKatchMcArdleBMR,
  calculateMifflinStJeorBMR,
  calculateTDEE,
  ACTIVITY_MULTIPLIERS,
  ACTIVITY_DESCRIPTIONS,
} from '../lib/fitnessCalculators';

interface FitnessToolsProps {
  focusedTool?: 'bmi' | 'tdee' | 'macro' | 'body-fat';
}

export default function FitnessTools({ focusedTool }: FitnessToolsProps) {
  // Active sub-tool tab state
  const [activeTab, setActiveTab] = useState<'all' | 'body-fat' | 'tdee' | 'macro' | 'bmi'>(
    focusedTool || 'all'
  );

  // Synchronize with prop changes
  useEffect(() => {
    if (focusedTool) {
      setActiveTab(focusedTool);
    }
  }, [focusedTool]);

  // Toast notification state for interactive data transfer
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // ==========================================
  // 1. U.S. Navy Body Fat Calculator State
  // ==========================================
  const [bfGender, setBfGender] = useState<'male' | 'female'>('male');
  const [bfUnit, setBfUnit] = useState<'metric' | 'imperial'>('metric');
  const [bfHeight, setBfHeight] = useState<number>(178); // cm or inches
  const [bfWeight, setBfWeight] = useState<number>(78); // kg or lbs
  const [bfNeck, setBfNeck] = useState<number>(39); // cm or inches
  const [bfWaist, setBfWaist] = useState<number>(84); // cm or inches
  const [bfHip, setBfHip] = useState<number>(98); // cm or inches (for females)

  const [bfResult, setBfResult] = useState<BodyFatResult>({
    bodyFatPercentage: 14.9,
    fatMassKg: 11.6,
    leanMassKg: 66.4,
    category: 'Fitness (14-17%)',
  });

  // Calculate Body Fat whenever inputs change
  useEffect(() => {
    const input: BodyFatInput = {
      gender: bfGender,
      unit: bfUnit,
      height: bfHeight,
      weight: bfWeight,
      neck: bfNeck,
      waist: bfWaist,
      hip: bfGender === 'female' ? bfHip : undefined,
    };
    const res = calculateUSNavyBodyFat(input);
    setBfResult(res);
  }, [bfGender, bfUnit, bfHeight, bfWeight, bfNeck, bfWaist, bfHip]);

  // Handle unit toggle with intelligent value conversion
  const handleUnitToggle = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === bfUnit) return;
    if (newUnit === 'imperial') {
      // Metric -> Imperial
      setBfUnit('imperial');
      setBfHeight(Number((bfHeight / 2.54).toFixed(1)));
      setBfWeight(Number((bfWeight * 2.20462).toFixed(1)));
      setBfNeck(Number((bfNeck / 2.54).toFixed(1)));
      setBfWaist(Number((bfWaist / 2.54).toFixed(1)));
      setBfHip(Number((bfHip / 2.54).toFixed(1)));
    } else {
      // Imperial -> Metric
      setBfUnit('metric');
      setBfHeight(Math.round(bfHeight * 2.54));
      setBfWeight(Math.round(bfWeight / 2.20462));
      setBfNeck(Number((bfNeck * 2.54).toFixed(1)));
      setBfWaist(Number((bfWaist * 2.54).toFixed(1)));
      setBfHip(Number((bfHip * 2.54).toFixed(1)));
    }
  };

  // ==========================================
  // 2. TDEE & BMR Calculator State (Katch-McArdle + Mifflin-St Jeor)
  // ==========================================
  const [tdeeFormula, setTdeeFormula] = useState<'katch-mcardle' | 'mifflin-st-jeor'>('katch-mcardle');
  const [tdeeAge, setTdeeAge] = useState<number>(32);
  const [tdeeGender, setTdeeGender] = useState<'male' | 'female'>('male');
  const [tdeeWeight, setTdeeWeight] = useState<number>(78); // kg
  const [tdeeHeight, setTdeeHeight] = useState<number>(178); // cm
  const [tdeeBodyFat, setTdeeBodyFat] = useState<number>(14.9); // % for Katch-McArdle
  const [tdeeActivity, setTdeeActivity] = useState<ActivityLevel>('moderately-active');

  const [tdeeBmr, setTdeeBmr] = useState<number>(1804);
  const [tdeeValue, setTdeeValue] = useState<number>(2796);
  const [tdeeLeanMass, setTdeeLeanMass] = useState<number>(66.4);
  const [tdeeFatMass, setTdeeFatMass] = useState<number>(11.6);
  const [mifflinComparisonBmr, setMifflinComparisonBmr] = useState<number>(1710);
  const [katchComparisonBmr, setKatchComparisonBmr] = useState<number>(1804);

  // Calculate TDEE and BMR
  useEffect(() => {
    // Katch-McArdle BMR
    const katch = calculateKatchMcArdleBMR(tdeeWeight, tdeeBodyFat);
    setKatchComparisonBmr(katch.bmr);
    setTdeeLeanMass(katch.leanMassKg);
    setTdeeFatMass(katch.fatMassKg);

    // Mifflin-St Jeor BMR
    const mifflin = calculateMifflinStJeorBMR(tdeeWeight, tdeeHeight, tdeeAge, tdeeGender);
    setMifflinComparisonBmr(mifflin);

    const activeBmr = tdeeFormula === 'katch-mcardle' ? katch.bmr : mifflin;
    setTdeeBmr(activeBmr);

    const totalTdee = calculateTDEE(activeBmr, tdeeActivity);
    setTdeeValue(totalTdee);
  }, [tdeeFormula, tdeeAge, tdeeGender, tdeeWeight, tdeeHeight, tdeeBodyFat, tdeeActivity]);

  // Action: Transfer Body Fat from Navy Calculator to TDEE Calculator
  const handleTransferToTdee = () => {
    // Standardize weight to kg
    const weightInKg = bfUnit === 'metric' ? bfWeight : Math.round(bfWeight * 0.45359237);
    const heightInCm = bfUnit === 'metric' ? bfHeight : Math.round(bfHeight * 2.54);

    setTdeeGender(bfGender);
    setTdeeWeight(weightInKg);
    setTdeeHeight(heightInCm);
    setTdeeBodyFat(bfResult.bodyFatPercentage);
    setTdeeFormula('katch-mcardle');

    showToast(
      `✓ Transferred ${bfResult.bodyFatPercentage}% Body Fat & ${bfResult.leanMassKg} kg Lean Mass directly into Katch-McArdle BMR!`
    );

    // Smooth scroll to TDEE section if on 'all' tab
    const el = document.getElementById('tdee-calculator-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ==========================================
  // 3. Macro Splitter State
  // ==========================================
  const [macroCalories, setMacroCalorieInput] = useState<number>(2796);
  const [macroGoal, setMacroGoal] = useState<'shred' | 'lean' | 'bulk'>('lean');
  const [macrosResult, setMacrosResult] = useState<MacroSplit>({ protein: 210, carbs: 280, fats: 93 });

  // Calculate Macros
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

  // Action: Apply TDEE to Macro Splitter
  const handleApplyTdeeToMacros = () => {
    setMacroCalorieInput(tdeeValue);
    showToast(`✓ Applied TDEE maintenance baseline (${tdeeValue} kcal/day) to the Scientific Macro Splitter!`);
    const el = document.getElementById('macro-splitter-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ==========================================
  // 4. BMI Calculator State
  // ==========================================
  const [bmiWeight, setBmiWeight] = useState(78); // kg
  const [bmiHeight, setBmiHeight] = useState(178); // cm
  const [bmiValue, setBmiResult] = useState(24.62);
  const [bmiCategory, setBmiCategory] = useState('Normal weight');

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

  // Coach advice generation logic based on user inputs
  const getCoachAdvice = () => {
    const activeLevelText = {
      'sedentary': 'mainly desk-bound or inactive',
      'lightly-active': 'active 1–2 times a week',
      'moderately-active': 'working out 3–5 times a week',
      'very-active': 'engaging in intense physical workloads',
      'extra-active': 'highly intense athletic routines',
    }[tdeeActivity];

    if (macroGoal === 'shred') {
      return {
        title: 'High-Converting Fat Loss Strategy',
        target: `${Math.round(macroCalories - 450)} kcal/day`,
        deficit: '450 kcal deficit applied',
        text: `Since your goal is Fat Loss/Shred, Coach Chinmay suggests applying a steady 400–500 kcal deficit. We have calculated your safe target calorie intake. Notice that we keep protein elevated at ${macrosResult.protein}g to preserve lean muscle tissue while mobilizing fat. You will still eat ${macrosResult.carbs}g of clean carbohydrates daily—zero starvation or low-carb fatigue required.`,
        icon: <TrendingDown className="h-5 w-5 text-rose-500" />,
        recoPlan: '3 Months Plan - Fitness Fundamentals',
      };
    } else if (macroGoal === 'bulk') {
      return {
        title: 'Controlled Lean Muscular Bulk',
        target: `${Math.round(macroCalories + 300)} kcal/day`,
        deficit: '300 kcal surplus applied',
        text: `To construct clean natural physical size, Coach Chinmay suggests a mild, clean caloric surplus of 200–300 kcal. This feeds muscular hypertrophy without unnecessary fat storage. Your protein target of ${macrosResult.protein}g is fully supported by a high-energy intake of ${macrosResult.carbs}g of clean carbohydrates, ensuring deep cellular recovery and joint longevity from healthy fats.`,
        icon: <TrendingUp className="h-5 w-5 text-brand-green" />,
        recoPlan: '6 Months Plan - Comprehensive',
      };
    } else {
      return {
        title: 'Metabolic Optimization & Recomp',
        target: `${macroCalories} kcal/day`,
        deficit: 'Eucaloric maintenance baseline',
        text: `You are set for Lean Maintenance/Body Recomposition. This protocol focuses on simultaneous fat-loss and muscular tone. Since your activity is ${activeLevelText}, maintaining ${macroCalories} calories with ${macrosResult.protein}g of clean protein will systematically re-condition your insulin sensitivity, restore restful sleep patterns, and build metabolic stamina.`,
        icon: <Sparkle className="h-5 w-5 text-amber-500" />,
        recoPlan: 'Annual Plan - Longevity & Habits Builder',
      };
    }
  };

  const advice = getCoachAdvice();

  // SEO metadata setup
  let seoTitle = 'Free Fitness Calculators — Body Fat, TDEE, Macros, BMI | Fitkode';
  let seoDesc =
    'Evidence-based calculators using the U.S. Navy Body Fat Formula, Katch-McArdle BMR, and TDEE activity multipliers built for real transformations.';
  let seoCanonical = '/tools';

  if (focusedTool === 'body-fat' || activeTab === 'body-fat') {
    seoTitle = 'U.S. Navy Body Fat Calculator — Accurate Tape Method | Fitkode';
    seoDesc =
      'Calculate your body fat percentage with the validated U.S. Navy Body Fat formula (Hodgdon & Beckett) using simple circumference tape measurements. Supports Metric and Imperial.';
    seoCanonical = '/tools/body-fat-calculator';
  } else if (focusedTool === 'tdee' || activeTab === 'tdee') {
    seoTitle = 'TDEE & BMR Calculator (Katch-McArdle & Mifflin-St Jeor) | Fitkode';
    seoDesc =
      'Calculate your Basal Metabolic Rate and Total Daily Energy Expenditure using the Katch-McArdle formula with lean body mass, plus Mifflin-St Jeor comparison.';
    seoCanonical = '/tools/tdee-calculator';
  } else if (focusedTool === 'macro' || activeTab === 'macro') {
    seoTitle = 'Macro Calculator for Fat Loss & Muscle Gain | Fitkode';
    seoDesc =
      'Split your target calories into precise protein, carb, and fat grams for fat loss, lean recomp, or muscle gain.';
    seoCanonical = '/tools/macro-calculator';
  } else if (focusedTool === 'bmi' || activeTab === 'bmi') {
    seoTitle = 'BMI Calculator for Indian Adults — Free | Fitkode';
    seoDesc =
      'Calculate your BMI instantly and understand its clinical boundaries versus actual body composition and lean body mass.';
    seoCanonical = '/tools/bmi-calculator';
  }

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': seoTitle,
    'url': `https://fitkode.com${seoCanonical}`,
    'applicationCategory': 'HealthApplication',
    'operatingSystem': 'All',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'INR',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-left">
      <Seo title={seoTitle} description={seoDesc} canonicalPath={seoCanonical} schema={webAppSchema} />

      {/* Floating Interactive Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-brand-dark-green text-white px-5 py-3.5 rounded-2xl shadow-xl border border-brand-green/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
          <p className="text-xs font-semibold leading-snug">{toastMessage}</p>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center space-y-3 bg-white rounded-3xl p-8 md:p-10 border border-brand-light-green shadow-xs max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-brand-green bg-brand-light-green/50">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" /> EVIDENCE-BASED PHYSICAL INTELLIGENCE
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-brand-dark-green tracking-tight">
          Scientific Fitness &amp; Body Composition Calculators
        </h1>
        <p className="text-xs text-gray-550 max-w-2xl mx-auto leading-relaxed">
          At Fitkode, we reject arbitrary guesswork. We link the <strong>U.S. Navy Body Fat Formula</strong>, the{' '}
          <strong>Katch-McArdle BMR equation</strong> (which accounts for your active lean muscle tissue), and clinical{' '}
          <strong>TDEE activity factors</strong> into a seamless, unified transformation pipeline.
        </p>
      </div>

      {/* Interactive Pipeline Visual Flow (Matches Page 5 of Document) */}
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-emerald-900 via-brand-dark-green to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-green font-bold flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Integrated Calculation Pipeline
            </span>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
              From Tape Measurements to Precision Calorie &amp; Macro Splits
            </h2>
          </div>
          <span className="text-[11px] text-gray-300 bg-white/10 px-3 py-1 rounded-full font-medium">
            Live Interconnected Values
          </span>
        </div>

        {/* 5-Step Pipeline Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-5">
          {/* Step 1 */}
          <div
            onClick={() => setActiveTab('body-fat')}
            className="cursor-pointer group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold">
              <span>01. TAPE INPUT</span>
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-xs font-semibold text-white truncate">
              {bfWaist} {bfUnit === 'metric' ? 'cm' : 'in'} waist
            </p>
            <p className="text-[10px] text-gray-300">Neck, waist &amp; hips</p>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => setActiveTab('body-fat')}
            className="cursor-pointer group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-emerald-500/30 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold">
              <span>02. U.S. NAVY</span>
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-sm font-extrabold text-brand-green font-mono">{bfResult.bodyFatPercentage}% BF</p>
            <p className="text-[10px] text-gray-300 truncate">{bfResult.category}</p>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => setActiveTab('tdee')}
            className="cursor-pointer group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold">
              <span>03. LEAN MASS</span>
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-sm font-extrabold text-amber-300 font-mono">{tdeeLeanMass} kg</p>
            <p className="text-[10px] text-gray-300">Active metabolic tissue</p>
          </div>

          {/* Step 4 */}
          <div
            onClick={() => setActiveTab('tdee')}
            className="cursor-pointer group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold">
              <span>04. KATCH BMR</span>
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-sm font-extrabold text-white font-mono">{tdeeBmr} kcal</p>
            <p className="text-[10px] text-gray-300">TDEE: {tdeeValue} kcal</p>
          </div>

          {/* Step 5 */}
          <div
            onClick={() => setActiveTab('macro')}
            className="cursor-pointer group p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-1.5 col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold">
              <span>05. MACROS</span>
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-xs font-bold text-white font-mono truncate">
              {macrosResult.protein}P • {macrosResult.carbs}C • {macrosResult.fats}F
            </p>
            <p className="text-[10px] text-gray-300">Goal: {macroGoal.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
        {[
          { id: 'all', label: 'All Calculators', icon: <Sparkles className="h-3.5 w-3.5" /> },
          { id: 'body-fat', label: 'U.S. Navy Body Fat %', icon: <Percent className="h-3.5 w-3.5" /> },
          { id: 'tdee', label: 'TDEE & Katch-McArdle BMR', icon: <Flame className="h-3.5 w-3.5" /> },
          { id: 'macro', label: 'Macro Splitter', icon: <Dumbbell className="h-3.5 w-3.5" /> },
          { id: 'bmi', label: 'BMI Calculator', icon: <Scale className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-dark-green text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-brand-light-green/40 border border-brand-light-green'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Free Interactive Planner Tools Spotlight */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-white to-amber-50/60 p-6 rounded-3xl border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                Free Planner Tool
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Custom Meal Planner</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Formulate your daily meals with automated macro calculation (Protein, Carbs, Fats, Fibres), food database
              items, and personal preferences. Plans sync to your profile.
            </p>
          </div>
          <Link
            to="/meal-planner"
            className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Launch Free Meal Planner</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-white to-indigo-50/60 p-6 rounded-3xl border border-indigo-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <Dumbbell className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded-full">
                Free Planner Tool
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Custom Workout Routine Planner</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Design multi-day training splits (Push/Pull/Legs, Upper/Lower, Full Body) with targeted sets, reps, cues,
              and exercise library. Also receives coach prescriptions.
            </p>
          </div>
          <Link
            to="/workout-planner"
            className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Launch Free Workout Planner</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. U.S. NAVY BODY FAT CALCULATOR */}
      {/* ========================================================= */}
      {(activeTab === 'all' || activeTab === 'body-fat') && (
        <section
          id="body-fat-calculator-section"
          className="bg-white p-6 md:p-8 rounded-3xl border border-brand-light-green shadow-xs max-w-6xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-brand-green rounded-2xl border border-emerald-100">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-extrabold text-brand-dark-green text-lg">
                    U.S. Navy Body Fat Calculator
                  </h3>
                  <span className="text-[9px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Hodgdon &amp; Beckett
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Gold standard tape-measure algorithm validated within ±3–4% of clinical DEXA scans.
                </p>
              </div>
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => handleUnitToggle('metric')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  bfUnit === 'metric' ? 'bg-white text-brand-dark-green shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Metric (cm / kg)
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('imperial')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  bfUnit === 'imperial' ? 'bg-white text-brand-dark-green shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Imperial (in / lbs)
              </button>
            </div>
          </div>

          {/* Body Fat Inputs & Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Inputs Column */}
            <div className="lg:col-span-7 space-y-5">
              {/* Gender selector */}
              <div>
                <label className="block mb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Biological Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBfGender('male')}
                    className={`py-2.5 px-4 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      bfGender === 'male'
                        ? 'border-brand-green text-brand-green bg-brand-light-green/40 shadow-xs'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span>👨 Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBfGender('female')}
                    className={`py-2.5 px-4 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      bfGender === 'female'
                        ? 'border-brand-green text-brand-green bg-brand-light-green/40 shadow-xs'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span>👩 Female (Includes Hip Measure)</span>
                  </button>
                </div>
              </div>

              {/* Physical measurements inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-brand-dark-green">
                {/* Height */}
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Height ({bfUnit === 'metric' ? 'cm' : 'inches'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={bfHeight}
                    onChange={(e) => setBfHeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Measured standing tall without shoes</p>
                </div>

                {/* Body Weight */}
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Body Weight ({bfUnit === 'metric' ? 'kg' : 'lbs'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={bfWeight}
                    onChange={(e) => setBfWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Fasting morning body weight</p>
                </div>

                {/* Neck circumference */}
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Neck Circumference ({bfUnit === 'metric' ? 'cm' : 'inches'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={bfNeck}
                    onChange={(e) => setBfNeck(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Below Adam's apple / larynx, tape horizontal</p>
                </div>

                {/* Waist circumference */}
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Waist Circumference ({bfUnit === 'metric' ? 'cm' : 'inches'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={bfWaist}
                    onChange={(e) => setBfWaist(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">
                    {bfGender === 'male' ? 'Horizontally across the navel' : 'Narrowest point between ribs & hips'}
                  </p>
                </div>

                {/* Hip circumference (only for females) */}
                {bfGender === 'female' && (
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                      <span>Hip Circumference ({bfUnit === 'metric' ? 'cm' : 'inches'})</span>
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        Required for Women
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={bfHip}
                      onChange={(e) => setBfHip(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                    />
                    <p className="text-[9px] text-gray-400 mt-1">
                      Widest horizontal circumference around hips and buttocks
                    </p>
                  </div>
                )}
              </div>

              {/* Exact Formula Explanation Note */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-xs text-emerald-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-brand-dark-green">
                  <Info className="h-4 w-4 text-brand-green flex-shrink-0" />
                  <span>Mathematical Precision &amp; Unit Handling:</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {bfGender === 'male' ? (
                    <>
                      <strong>Men:</strong>{' '}
                      <code className="text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        86.010 × log₁₀(waist − neck) − 70.041 × log₁₀(height) + 36.76
                      </code>
                    </>
                  ) : (
                    <>
                      <strong>Women:</strong>{' '}
                      <code className="text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        163.205 × log₁₀(waist + hip − neck) − 97.684 × log₁₀(height) − 78.387
                      </code>
                    </>
                  )}
                  <br />
                  <span className="text-[10px] text-gray-500">
                    *Our engine automatically manages logarithmic unit conversions so metric centimeters and imperial
                    inches yield DEXA-calibrated accuracy.
                  </span>
                </p>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-5 bg-gradient-to-br from-brand-light-green/30 to-emerald-50/80 rounded-2xl p-6 border border-brand-green/20 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-green font-mono">
                  ESTIMATED BODY COMPOSITION
                </span>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-4xl font-black text-brand-dark-green font-mono">{bfResult.bodyFatPercentage}%</h4>
                  <span className="text-xs font-bold text-gray-500 uppercase">Body Fat</span>
                </div>
                <div>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-extrabold bg-white text-brand-dark-green border border-brand-green/30 shadow-xs">
                    {bfResult.category}
                  </span>
                </div>
              </div>

              {/* Lean Mass vs Fat Mass Breakdown */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-xl border border-brand-light-green shadow-xs space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Lean Body Mass (LBM)</span>
                  <p className="text-lg font-black text-brand-dark-green font-mono">
                    {bfResult.leanMassKg} <span className="text-[10px] font-bold text-gray-400">kg</span>
                  </p>
                  <p className="text-[9px] text-gray-500 font-medium">Muscles, bones, organs &amp; fluids</p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-brand-light-green shadow-xs space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Total Fat Mass</span>
                  <p className="text-lg font-black text-gray-700 font-mono">
                    {bfResult.fatMassKg} <span className="text-[10px] font-bold text-gray-400">kg</span>
                  </p>
                  <p className="text-[9px] text-gray-500 font-medium">Subcutaneous &amp; visceral fat</p>
                </div>
              </div>

              {/* Reference Standards Table */}
              <div className="bg-white/90 rounded-xl p-3 border border-emerald-100 text-[10px] space-y-1.5">
                <p className="font-bold text-brand-dark-green uppercase tracking-wider text-[9px]">
                  ACE Body Fat Categories ({bfGender === 'male' ? 'Men' : 'Women'}):
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-600 font-medium">
                  <div>Essential Fat: {bfGender === 'male' ? '2–5%' : '10–13%'}</div>
                  <div>Athletes: {bfGender === 'male' ? '6–13%' : '14–20%'}</div>
                  <div>Fitness: {bfGender === 'male' ? '14–17%' : '21–24%'}</div>
                  <div>Average: {bfGender === 'male' ? '18–24%' : '25–31%'}</div>
                </div>
              </div>

              {/* Direct Pipeline Connection Button */}
              <button
                type="button"
                onClick={handleTransferToTdee}
                className="w-full py-3 px-4 bg-brand-green hover:bg-brand-dark-green text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
              >
                <span>Transfer to Katch-McArdle TDEE</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 2. TDEE & BMR CALCULATOR (KATCH-MCARDLE + MIFFLIN-ST JEOR) */}
      {/* ========================================================= */}
      {(activeTab === 'all' || activeTab === 'tdee') && (
        <section
          id="tdee-calculator-section"
          className="bg-white p-6 md:p-8 rounded-3xl border border-brand-light-green shadow-xs max-w-6xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-extrabold text-brand-dark-green text-lg">
                    Daily Energy Expenditure (TDEE &amp; BMR)
                  </h3>
                  <span className="text-[9px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    Katch-McArdle &amp; Mifflin
                  </span>
                </div>
                <p className="text-xs text-gray-550">
                  Calculates baseline metabolic upkeep and full daily expenditure based on your lean mass and workload.
                </p>
              </div>
            </div>

            {/* Formula Selector Tabs */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setTdeeFormula('katch-mcardle')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tdeeFormula === 'katch-mcardle'
                    ? 'bg-brand-dark-green text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>⭐ Katch-McArdle (Lean Mass)</span>
              </button>
              <button
                type="button"
                onClick={() => setTdeeFormula('mifflin-st-jeor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tdeeFormula === 'mifflin-st-jeor'
                    ? 'bg-brand-dark-green text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Mifflin-St Jeor (Standard)
              </button>
            </div>
          </div>

          {/* Formula specific explanation callout */}
          {tdeeFormula === 'katch-mcardle' ? (
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/60 text-xs text-amber-950 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[11px] text-amber-900">
                  Katch-McArdle Formula Active: <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[10px] border border-amber-200">BMR = 370 + (21.6 × Lean Body Mass in kg)</code>
                </p>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  Unlike standard height-weight formulas, Katch-McArdle isolates active metabolizing muscular tissue. This makes it substantially more precise for fit, muscular, and overweight individuals alike.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/60 text-xs text-blue-950 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[11px] text-blue-900">
                  Mifflin-St Jeor Formula Active: Standard Age/Height/Weight Algorithm
                </p>
                <p className="text-[11px] text-blue-900/80 leading-relaxed">
                  Best used when body fat percentage is unknown. (Switch to Katch-McArdle above if you know or calculated your body fat %!)
                </p>
              </div>
            </div>
          )}

          {/* TDEE Inputs & Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Inputs Form */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-brand-dark-green">
                {/* Weight */}
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Body Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={tdeeWeight}
                    onChange={(e) => setTdeeWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                  />
                </div>

                {/* Body Fat % (Shown primarily for Katch-McArdle) */}
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                    <span>Body Fat Percentage (%)</span>
                    {tdeeFormula === 'katch-mcardle' && (
                      <span className="text-[9px] font-bold text-brand-green bg-brand-light-green/60 px-1.5 py-0.2 rounded">
                        Key Driver
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={tdeeBodyFat}
                    onChange={(e) => setTdeeBodyFat(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                  />
                </div>

                {/* Age & Height (Shown for Mifflin-St Jeor fallback) */}
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={tdeeAge}
                    onChange={(e) => setTdeeAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={tdeeHeight}
                    onChange={(e) => setTdeeHeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-green font-semibold"
                  />
                </div>

                {/* Gender */}
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Biological Gender
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTdeeGender('male')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        tdeeGender === 'male'
                          ? 'border-brand-green text-brand-green bg-brand-light-green/40'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setTdeeGender('female')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        tdeeGender === 'female'
                          ? 'border-brand-green text-brand-green bg-brand-light-green/40'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Activity Level Selector */}
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Physical Activity Level (PAL Factor)
                  </label>
                  <select
                    value={tdeeActivity}
                    onChange={(e) => setTdeeActivity(e.target.value as ActivityLevel)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-brand-green text-xs font-semibold"
                  >
                    <option value="sedentary">Sedentary — Little or no exercise / desk job (1.20x)</option>
                    <option value="lightly-active">Lightly Active — Light exercise 1–3 days/week (1.375x)</option>
                    <option value="moderately-active">
                      Moderately Active — Resistance training / sports 3–5 days/week (1.55x)
                    </option>
                    <option value="very-active">Very Active — Heavy training 6–7 days/week (1.725x)</option>
                    <option value="extra-active">
                      Super / Extra Active — Twice/day workouts, heavy labor (1.90x)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-2xl p-6 border border-amber-200/80 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 font-mono">
                  TOTAL DAILY ENERGY EXPENDITURE (TDEE)
                </span>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-4xl font-black text-brand-dark-green font-mono">{tdeeValue}</h4>
                  <span className="text-xs font-bold text-gray-500 uppercase">kcal / day</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">Daily maintenance intake to preserve current weight.</p>
              </div>

              {/* BMR + Lean Mass Stats */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-xs space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Basal Rate (BMR)</span>
                  <p className="text-xl font-black text-brand-dark-green font-mono">
                    {tdeeBmr} <span className="text-[10px] font-bold text-gray-400">kcal</span>
                  </p>
                  <p className="text-[9px] text-gray-500">24h resting baseline</p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-xs space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Lean Mass (LBM)</span>
                  <p className="text-xl font-black text-amber-700 font-mono">
                    {tdeeLeanMass} <span className="text-[10px] font-bold text-gray-400">kg</span>
                  </p>
                  <p className="text-[9px] text-gray-500">Fat mass: {tdeeFatMass} kg</p>
                </div>
              </div>

              {/* Scientific Comparison Banner */}
              <div className="bg-white/90 rounded-xl p-3 border border-amber-200/80 text-[11px] text-gray-600 space-y-1">
                <p className="font-bold text-gray-900">Scientific Formula Comparison:</p>
                <div className="flex justify-between text-[11px] font-mono">
                  <span>• Katch-McArdle BMR:</span>
                  <strong className="text-brand-dark-green">{katchComparisonBmr} kcal</strong>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-gray-500">
                  <span>• Mifflin-St Jeor BMR:</span>
                  <span>{mifflinComparisonBmr} kcal</span>
                </div>
                <p className="text-[10px] text-gray-500 italic pt-1 border-t border-gray-100">
                  {katchComparisonBmr >= mifflinComparisonBmr
                    ? `Katch-McArdle is +${katchComparisonBmr - mifflinComparisonBmr} kcal higher because active lean muscle burns more calories at rest.`
                    : `Katch-McArdle is ${mifflinComparisonBmr - katchComparisonBmr} kcal lower, avoiding caloric overestimation.`}
                </p>
              </div>

              {/* Apply to Macro Splitter Button */}
              <button
                type="button"
                onClick={handleApplyTdeeToMacros}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
              >
                <span>Apply {tdeeValue} kcal to Macro Splitter</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 3. MACRO-NUTRIENT SPLITTER */}
      {/* ========================================================= */}
      {(activeTab === 'all' || activeTab === 'macro') && (
        <section
          id="macro-splitter-section"
          className="bg-white rounded-3xl border border-brand-light-green p-6 md:p-8 shadow-xs space-y-8 max-w-6xl mx-auto"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-light-green/50 text-brand-green rounded-2xl">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-brand-dark-green text-lg">
                  Scientific Macro-Nutrient Splitter
                </h3>
                <p className="text-xs text-gray-500">Organize daily proteins, carbohydrates, and healthy essential fats correctly.</p>
              </div>
            </div>

            {/* Target energy calibration */}
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-brand-dark-green font-mono px-2">Daily Calories:</span>
              <input
                type="number"
                value={macroCalories}
                onChange={(e) => setMacroCalorieInput(Number(e.target.value))}
                className="w-24 px-2.5 py-1.5 bg-white border border-brand-light-green rounded-lg text-xs font-bold font-mono text-center focus:outline-none focus:border-brand-green shadow-xs"
              />
              <span className="text-[10px] text-gray-400 font-bold uppercase pr-2">kcal</span>
            </div>
          </div>

          {/* Dynamic Goal Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            <button
              onClick={() => setMacroGoal('shred')}
              type="button"
              className={`py-4 px-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                macroGoal === 'shred'
                  ? 'border-brand-green text-brand-green bg-brand-light-green/40 shadow-xs'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-1.5">🏃 Fat Loss / Shred</span>
              <span className="text-[9px] text-gray-400 font-medium font-mono">35% Protein | 35% Carbs | 30% Fats</span>
            </button>

            <button
              onClick={() => setMacroGoal('lean')}
              type="button"
              className={`py-4 px-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                macroGoal === 'lean'
                  ? 'border-brand-green text-brand-green bg-brand-light-green/40 shadow-xs'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-1.5">⚖️ Lean Maintenance</span>
              <span className="text-[9px] text-gray-400 font-medium font-mono">30% Protein | 40% Carbs | 30% Fats</span>
            </button>

            <button
              onClick={() => setMacroGoal('bulk')}
              type="button"
              className={`py-4 px-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                macroGoal === 'bulk'
                  ? 'border-brand-green text-brand-green bg-brand-light-green/40 shadow-xs'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
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
              <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">
                {macrosResult.protein} <span className="text-xs text-gray-400 font-bold uppercase">g</span>
              </h4>
              <p className="text-[11px] text-gray-500 leading-normal">
                Essential for lean muscle preservation, tissue repair, enzyme function, and satiety.
              </p>
            </div>

            <div className="bg-brand-light-green/20 rounded-2xl p-6 border border-brand-green/10 text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600" />
              <span className="text-[10px] text-amber-700 uppercase font-bold tracking-widest font-mono">Carbohydrates</span>
              <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">
                {macrosResult.carbs} <span className="text-xs text-gray-400 font-bold uppercase">g</span>
              </h4>
              <p className="text-[11px] text-gray-500 leading-normal">
                Primary cellular energy for heavy gym lifting, high cognitive focus, and workout glycogen.
              </p>
            </div>

            <div className="bg-brand-light-green/20 rounded-2xl p-6 border border-brand-green/10 text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-700" />
              <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-widest font-mono">Fats</span>
              <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">
                {macrosResult.fats} <span className="text-xs text-gray-400 font-bold uppercase">g</span>
              </h4>
              <p className="text-[11px] text-gray-500 leading-normal">
                Crucial for baseline hormone production, fat-soluble vitamins (A, D, E, K), and joints.
              </p>
            </div>
          </div>

          {/* Coach Diagnostics Advisor */}
          <div className="bg-natural-oat/60 rounded-2xl border border-brand-light-green p-6 text-left relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-green text-white rounded-xl flex-shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-brand-green font-extrabold font-mono bg-brand-light-green px-2 py-0.5 rounded">
                    COACH DIAGNOSTIC SUMMARY
                  </span>
                  <h4 className="font-display font-extrabold text-brand-dark-green text-lg flex items-center gap-2">
                    {advice.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                    Calculated Goal Intake: {advice.target} | {advice.deficit}
                  </p>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed italic font-serif">"{advice.text}"</p>

                <div className="h-[1px] bg-brand-light-green w-full" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">SUGGESTED FITKODE PROGRAM</p>
                    <p className="text-xs font-extrabold text-brand-dark-green">{advice.recoPlan}</p>
                  </div>

                  <Link
                    to="/coaching-plans"
                    className="px-4 py-2 bg-brand-green hover:bg-brand-dark-green text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 uppercase tracking-wide cursor-pointer"
                  >
                    Apply Metrics to Coaching Program <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. BODY MASS INDEX (BMI) */}
      {/* ========================================================= */}
      {(activeTab === 'all' || activeTab === 'bmi') && (
        <section
          id="bmi-calculator-section"
          className="bg-white p-6 md:p-8 rounded-3xl border border-brand-light-green shadow-xs max-w-6xl mx-auto space-y-6"
        >
          <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
            <div className="p-3 bg-brand-light-green/50 text-brand-green rounded-2xl">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-brand-dark-green text-lg">Body Mass Index (BMI)</h3>
              <p className="text-xs text-gray-500">Track general physical mass-to-height ratio.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-brand-dark-green">
                  <span>Height: {bmiHeight} cm</span>
                  <span className="text-gray-400 font-mono">140 – 220 cm</span>
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
                  <span className="text-gray-400 font-mono">40 – 150 kg</span>
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
            <div className="bg-brand-light-green/30 rounded-2xl p-6 border border-brand-green/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-brand-green font-bold uppercase tracking-wider">Estimated BMI Value</p>
                <h4 className="text-4xl font-black text-brand-dark-green font-display">{bmiValue}</h4>
              </div>
              <div className="text-right space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-widest text-brand-dark-green bg-white px-3.5 py-2 rounded-xl shadow-xs border border-brand-light-green inline-block">
                  {bmiCategory}
                </span>
                <p className="text-[9px] text-gray-400 font-semibold block uppercase">Healthy: 18.5 – 24.9</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed italic text-center">
            *Clinical Note: BMI is an epidemiological screening metric that cannot differentiate dense muscle from body fat.
            We strongly recommend relying on the <strong>U.S. Navy Body Fat Calculator</strong> and{' '}
            <strong>Katch-McArdle BMR</strong> above for accurate personal body composition analysis.
          </p>
        </section>
      )}

      {/* ========================================================= */}
      {/* 5. SCIENTIFIC RESEARCH & EVIDENCE BASE */}
      {/* ========================================================= */}
      <div className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-200 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-brand-dark-green font-bold text-sm">
          <BookOpen className="h-4 w-4 text-brand-green" />
          <span>Scientific Research &amp; Validation Sources</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/70 space-y-1.5">
            <h4 className="font-bold text-brand-dark-green text-[11px] uppercase tracking-wide">
              U.S. Navy Method (Hodgdon &amp; Beckett, 1984)
            </h4>
            <p className="text-[11px] leading-relaxed">
              Derived from large-scale anthropometric naval research. Multiple independent trials confirm high correlation
              with dual-energy x-ray absorptiometry (DEXA) scans (within ±3–4% error).
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/70 space-y-1.5">
            <h4 className="font-bold text-brand-dark-green text-[11px] uppercase tracking-wide">
              Katch &amp; McArdle (1996)
            </h4>
            <p className="text-[11px] leading-relaxed">
              Published in <em>Essentials of Exercise Physiology</em>. Proven by comparison studies (Journal of Clinical
              Nutrition) to predict resting metabolic rate closer to DEXA-derived lean mass than standard formulas.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/70 space-y-1.5">
            <h4 className="font-bold text-brand-dark-green text-[11px] uppercase tracking-wide">
              ISSN Position Stand (2018)
            </h4>
            <p className="text-[11px] leading-relaxed">
              The International Society of Sports Nutrition recommends body-fat-adjusted BMR calculations over generic
              formulas for athletic preparation and sustainable long-term fat loss protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
