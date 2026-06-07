import React, { useState, useEffect } from 'react';
import { ActivityLevel, TDEEInput, MacroSplit } from '../types';
import { Dumbbell, Scale, Flame, Sparkles } from 'lucide-react';

export default function FitnessTools() {
  // BMI Calculator States
  const [bmiWeight, setBmiWeight] = useState(70); // kg
  const [bmiHeight, setBmiHeight] = useState(175); // cm
  const [bmiValue, setBmiResult] = useState(22.86);
  const [bmiCategory, setBmiCategory] = useState('Normal');

  // TDEE States
  const [tdeeInput, setTdeeInput] = useState<TDEEInput>({
    age: 28,
    gender: 'male',
    weight: 75,
    height: 178,
    activity: 'moderately-active',
  });
  const [tdeeValue, setTdeeResult] = useState(2580);

  // Macros States
  const [macroCalories, setMacroCalorieInput] = useState(2580);
  const [macroGoal, setMacroGoal] = useState<'shred' | 'lean' | 'bulk'>('lean');
  const [macrosResult, setMacrosResult] = useState<MacroSplit>({ protein: 161, carbs: 290, fats: 86 });

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
    // Shredding: 40% P, 35% C, 25% F
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Upper description header */}
      <div className="text-center space-y-3 bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-brand-light-green shadow-sm max-w-4xl mx-auto">
        <span className="px-2.5 py-1 rounded bg-brand-light-green/60 text-brand-green font-bold text-xs uppercase tracking-wider">
          Fitkode Free Utilities
        </span>
        <h1 className="font-display text-3xl font-extrabold text-brand-dark-green tracking-tight">Interactive Fitness Calculators</h1>
        <p className="text-xs text-gray-500 max-w-xl mx-auto leading-relaxed">
          Estimate critical parameters such as BMI, Maintenance Calories (TDEE), and macro-nutrient distributions to jumpstart your body transformation correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* 1. BMI Dashboard Calculator */}
        <div className="bg-white/70 backdrop-blur-xs p-6 rounded-2xl border border-brand-light-green shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-light-green text-brand-green rounded-xl">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-brand-dark-green text-base">Body Mass Index (BMI)</h3>
              <p className="text-[10px] text-gray-450 uppercase font-semibold">Track relative category and body weight</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Height: {bmiHeight} cm</span>
                <span className="text-gray-400">140cm - 220cm</span>
              </div>
              <input 
                type="range"
                min="140"
                max="220"
                value={bmiHeight}
                onChange={(e) => setBmiHeight(Number(e.target.value))}
                className="w-full accent-brand-green bg-gray-200 rounded-lg appearance-none h-1.5"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Weight: {bmiWeight} kg</span>
                <span className="text-gray-400">40kg - 150kg</span>
              </div>
              <input 
                type="range"
                min="40"
                max="150"
                value={bmiWeight}
                onChange={(e) => setBmiWeight(Number(e.target.value))}
                className="w-full accent-brand-green bg-gray-200 rounded-lg appearance-none h-1.5"
              />
            </div>
          </div>

          {/* BMI Result Dial Container */}
          <div className="bg-brand-light-green/40 rounded-xl p-5 border border-brand-green/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-brand-dark-green uppercase font-extrabold tracking-wider">Your Body Mass Index</p>
              <h4 className="text-3xl font-black text-brand-dark-green font-display">{bmiValue}</h4>
            </div>
            <div className="text-right space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#111] bg-white px-3 py-1.5 rounded-full shadow-sm border border-brand-light-green inline-block">
                {bmiCategory}
              </span>
              <p className="text-[10px] text-gray-550 italic block font-serif">Healthy: 18.5 - 24.9</p>
            </div>
          </div>
        </div>

        {/* 2. TDEE (Calorie Calc) */}
        <div className="bg-white/70 backdrop-blur-xs p-6 rounded-2xl border border-brand-light-green shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-light-green text-brand-green rounded-xl">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-brand-dark-green text-base">Total Daily Energy Expenditure (TDEE)</h3>
              <p className="text-[10px] text-gray-450 uppercase font-semibold">Discover daily maintenance calories</p>
            </div>
          </div>

          {/* TDEE Form inputs */}
          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-700">
            <div>
              <label className="block mb-1 font-semibold">Age (Years)</label>
              <input 
                type="number" 
                value={tdeeInput.age}
                onChange={(e) => setTdeeInput({ ...tdeeInput, age: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg focus:outline-none focus:border-brand-green"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTdeeInput({ ...tdeeInput, gender: 'male' })}
                  type="button"
                  className={`py-2 rounded-lg border font-bold transition-all ${
                    tdeeInput.gender === 'male' 
                      ? 'border-brand-green text-brand-green bg-brand-light-green/35' 
                      : 'border-brand-light-green text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setTdeeInput({ ...tdeeInput, gender: 'female' })}
                  type="button"
                  className={`py-2 rounded-lg border font-bold transition-all ${
                    tdeeInput.gender === 'female' 
                      ? 'border-brand-green text-brand-green bg-brand-light-green/35' 
                      : 'border-brand-light-green text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold">Height (cm)</label>
              <input 
                type="number" 
                value={tdeeInput.height}
                onChange={(e) => setTdeeInput({ ...tdeeInput, height: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg focus:outline-none focus:border-brand-green"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Weight (kg)</label>
              <input 
                type="number" 
                value={tdeeInput.weight}
                onChange={(e) => setTdeeInput({ ...tdeeInput, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-brand-light-green rounded-lg focus:outline-none focus:border-brand-green"
              />
            </div>

            <div className="col-span-2">
              <label className="block mb-1 font-semibold">Current Activity Level</label>
              <select
                value={tdeeInput.activity}
                onChange={(e) => setTdeeInput({ ...tdeeInput, activity: e.target.value as ActivityLevel })}
                className="w-full px-3 py-2 border border-brand-light-green bg-white rounded-lg focus:outline-none focus:border-brand-green text-xs"
              >
                <option value="sedentary">Sedentary (Office job / minimal exercise)</option>
                <option value="lightly-active">Light Active (Exercise 1-2 days/week)</option>
                <option value="moderately-active">Moderately Active (Brisk activity/workouts 3-5 days/week)</option>
                <option value="very-active">Very Active (Heavy training 6-7 days/week)</option>
                <option value="extra-active">Extra Active (Professional athlete / construction worker)</option>
              </select>
            </div>
          </div>

          {/* TDEE result badge */}
          <div className="bg-brand-light-green/40 rounded-xl p-5 border border-brand-green/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-brand-dark-green uppercase font-extrabold tracking-wider">Estimated Maintenance Calories</p>
              <h4 className="text-3xl font-black text-brand-dark-green font-mono">{tdeeValue} <span className="text-xs text-gray-550 font-semibold uppercase">kcal/day</span></h4>
            </div>
            
            <button
              onClick={() => setMacroCalorieInput(tdeeValue)}
              className="text-[10px] font-bold text-white uppercase bg-brand-green px-3.5 py-2.5 rounded-lg shadow hover:bg-brand-dark-green transition-all"
            >
              Use For Macros
            </button>
          </div>
        </div>

      </div>

      {/* 3. Macros Distributor Dashboard */}
      <section className="bg-white/80 backdrop-blur-md rounded-2xl border border-brand-light-green p-6 shadow-sm space-y-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-light-green text-brand-green rounded-xl">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-brand-dark-green text-base">Simplified Macro-Nutrient Splitter</h3>
              <p className="text-[10px] text-gray-450 uppercase font-semibold">Distribute carbohydrates, proteins, and fats correctly</p>
            </div>
          </div>

          {/* Daily Calorie state override */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Daily Target:</span>
            <input 
              type="number"
              value={macroCalories}
              onChange={(e) => setMacroCalorieInput(Number(e.target.value))}
              className="w-24 px-2 py-1.5 bg-white border border-brand-light-green rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-brand-green"
            />
            <span className="text-[10px] text-gray-400 font-bold uppercase">kcal</span>
          </div>
        </div>

        {/* Goal Toggles */}
        <div className="grid grid-cols-3 gap-3 text-xs font-bold">
          <button
            onClick={() => setMacroGoal('shred')}
            type="button"
            className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              macroGoal === 'shred' 
                ? 'border-brand-green text-brand-green bg-brand-light-green/30' 
                : 'border-brand-light-green text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            <span>🏃 Fat Loss / Shred</span>
            <span className="text-[9px] text-gray-400 font-medium font-serif italic">35% Protein | 35% Carbs | 30% Fats</span>
          </button>
          <button
            onClick={() => setMacroGoal('lean')}
            type="button"
            className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              macroGoal === 'lean' 
                ? 'border-brand-green text-brand-green bg-brand-light-green/30' 
                : 'border-brand-light-green text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            <span>⚖️ Lean Maintenance</span>
            <span className="text-[9px] text-gray-400 font-medium font-serif italic">30% Protein | 40% Carbs | 30% Fats</span>
          </button>
          <button
            onClick={() => setMacroGoal('bulk')}
            type="button"
            className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
              macroGoal === 'bulk' 
                ? 'border-brand-green text-brand-green bg-brand-light-green/30' 
                : 'border-brand-light-green text-gray-500 bg-white hover:bg-gray-50'
            }`}
          >
            <span>💪 Muscle Bulk</span>
            <span className="text-[9px] text-gray-400 font-medium font-serif italic">25% Protein | 50% Carbs | 25% Fats</span>
          </button>
        </div>

        {/* Balanced macro result grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          <div className="bg-brand-light-green/20 rounded-2xl p-5 border border-brand-green/10 text-center space-y-2">
            <span className="text-[10px] text-brand-green uppercase font-semibold tracking-widest">Proteins</span>
            <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">{macrosResult.protein} <span className="text-xs text-gray-400 font-bold uppercase">g</span></h4>
            <p className="text-[10px] text-gray-500 leading-tight">Essential for biological repair, tissue recovery, aesthetics, and natural lean structure.</p>
          </div>

          <div className="bg-brand-light-green/20 rounded-2xl p-5 border border-brand-green/10 text-center space-y-2">
            <span className="text-[10px] text-[#5A5A40] uppercase font-semibold tracking-widest">Carbohydrates</span>
            <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">{macrosResult.carbs} <span className="text-xs text-gray-400 font-bold uppercase">g</span></h4>
            <p className="text-[10px] text-gray-500 leading-tight">Primary muscle glycogen fuel source. No carb starvation needed with Fitkode!</p>
          </div>

          <div className="bg-brand-light-green/20 rounded-2xl p-5 border border-brand-green/10 text-center space-y-2">
            <span className="text-[10px] text-[#8B8B70] uppercase font-semibold tracking-widest">Fats</span>
            <h4 className="text-4xl font-black text-brand-dark-green tracking-tight font-mono">{macrosResult.fats} <span className="text-xs text-gray-400 font-bold uppercase">g</span></h4>
            <p className="text-[10px] text-gray-500 leading-tight">Necessary for baseline biological hormones, cellular recovery, and joint lubrication.</p>
          </div>

        </div>
      </section>

    </div>
  );
}
