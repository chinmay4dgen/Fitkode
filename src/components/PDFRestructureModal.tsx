import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Plus,
  Trash2,
  Utensils,
  Layers,
  Flame,
  Scale,
  Clock,
  ChevronRight,
  Info,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { MealPlan, MealSlot, MealItem, DietType } from '../types';
import { saveMealPlanToSupabase } from '../lib/supabase';
import { getMemberOnboarding, extractMedicalSynopsis } from '../lib/medicalAssessmentHelper';

interface PDFRestructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  isCoachMode?: boolean;
  onAdoptRestructuredPlan: (plan: MealPlan) => void;
}

export interface ExtractedPlanData {
  plan_name: string;
  client_name?: string;
  diet_type: string;
  detected_notes?: string;
  total_summary: {
    total_calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
  };
  meals: Array<{
    meal_name: string;
    target_time: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    items: Array<{
      food_item: string;
      portion: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
      notes?: string;
    }>;
  }>;
}

export interface RestructuredPlanData {
  restructured_title: string;
  diet_type: string;
  day_summary: {
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fats_g: number;
    macro_variance_notes?: string;
  };
  medical_safety_warnings?: string[];
  swaps_applied_summary: string[];
  meals: Array<{
    meal_name: string;
    target_time: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    items: Array<{
      food_item: string;
      portion: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
      notes?: string;
      medical_warning?: string;
    }>;
  }>;
}

const COMMON_PREFERRED_FOODS = [
  'Paneer Tikka / Bhurji',
  'Greek Yogurt / Hung Curd',
  'Egg Whites / Whole Eggs',
  'Soya Chunks / Soya Keema',
  'Tofu Scramble',
  'Chicken Breast',
  'Oats Bowl with Berries',
  'Moong Dal Cheela',
  'Sprouts Salad',
  'Whey Protein Smoothie',
  'Quinoa Khichdi',
  'Sweet Potato Mash',
];

export default function PDFRestructureModal({
  isOpen,
  onClose,
  userEmail,
  userName = 'Member',
  isCoachMode = false,
  onAdoptRestructuredPlan,
}: PDFRestructureModalProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'extracted' | 'restructured'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isRestructuring, setIsRestructuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted plan from PDF
  const [extractedPlan, setExtractedPlan] = useState<ExtractedPlanData | null>(null);

  // Customization Inputs for Restructuring
  const [preferredFoodsList, setPreferredFoodsList] = useState<string[]>([
    'Paneer Tikka / Bhurji',
    'Moong Dal Cheela',
    'Greek Yogurt / Hung Curd',
  ]);
  const [preferredInput, setPreferredInput] = useState('');
  const [dislikedFoodsInput, setDislikedFoodsInput] = useState('Boiled egg whites, bland porridge');
  const [dietaryTypeSelection, setDietaryTypeSelection] = useState<string>('Vegetarian');
  const [customInstructions, setCustomInstructions] = useState(
    'Keep meals flavorful with Indian spices, easy to pack for office lunch.'
  );

  // Restructured result
  const [restructuredPlan, setRestructuredPlan] = useState<RestructuredPlanData | null>(null);

  // Load client onboarding for medical safety checks
  const clientOnboarding = React.useMemo(() => {
    return getMemberOnboarding(userEmail);
  }, [userEmail]);

  const medicalSynopsis = React.useMemo(() => {
    return extractMedicalSynopsis(clientOnboarding);
  }, [clientOnboarding]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    processFile(dropped);
  };

  const processFile = (fileToProcess: File) => {
    setError(null);
    if (fileToProcess.type !== 'application/pdf' && !fileToProcess.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file document.');
      return;
    }

    if (fileToProcess.size > 25 * 1024 * 1024) {
      setError('PDF file size is too large (maximum 25MB).');
      return;
    }

    setFile(fileToProcess);
    setFileName(fileToProcess.name);

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      // Extract clean base64 data without data:application/pdf;base64, prefix
      const base64Data = resultStr.includes('base64,')
        ? resultStr.split('base64,')[1]
        : resultStr;
      setFileBase64(base64Data);
    };
    reader.onerror = () => {
      setError('Failed to read the selected PDF file.');
    };
    reader.readAsDataURL(fileToProcess);
  };

  const handleExtractFromPDF = async () => {
    if (!fileBase64) {
      setError('Please choose a PDF file first.');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const res = await fetch('/api/extract-pdf-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: fileBase64,
          fileName: fileName || 'meal-plan.pdf',
          mimeType: 'application/pdf',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.extractedPlan) {
        throw new Error(data.error || 'Failed to extract nutrition information from the uploaded PDF.');
      }

      setExtractedPlan(data.extractedPlan);
      if (data.extractedPlan.diet_type) {
        setDietaryTypeSelection(data.extractedPlan.diet_type);
      }
      setCurrentStep('extracted');
    } catch (err: any) {
      console.error('Error during PDF extraction:', err);
      setError(err.message || 'Could not parse the PDF meal plan. Ensure it is a legible document.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddPreferredFood = (food: string) => {
    const trimmed = food.trim();
    if (!trimmed || preferredFoodsList.includes(trimmed)) return;
    setPreferredFoodsList([...preferredFoodsList, trimmed]);
    setPreferredInput('');
  };

  const handleRemovePreferredFood = (food: string) => {
    setPreferredFoodsList(preferredFoodsList.filter((f) => f !== food));
  };

  const handleRestructurePlan = async () => {
    if (!extractedPlan) return;
    setIsRestructuring(true);
    setError(null);

    try {
      // Compile full medical context from onboarding disclosures
      const medicalHistoryParts: string[] = [];
      if (clientOnboarding?.pastSurgeriesMedicalConditions) {
        medicalHistoryParts.push(`Medical History / Conditions: ${clientOnboarding.pastSurgeriesMedicalConditions}`);
      }
      if (clientOnboarding?.painInjuryDetails) {
        medicalHistoryParts.push(`Pain / Injuries: ${clientOnboarding.painInjuryDetails}`);
      }
      if (clientOnboarding?.digestiveIssues) {
        medicalHistoryParts.push(`Digestive Issues: ${clientOnboarding.digestiveIssues}`);
      }
      if (clientOnboarding?.medications) {
        medicalHistoryParts.push(`Current Medications: ${clientOnboarding.medications}`);
      }

      const allergyList = clientOnboarding?.foodAllergies || [];

      const res = await fetch('/api/restructure-pdf-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPlan: extractedPlan,
          preferredFoods: preferredFoodsList,
          dislikedFoods: dislikedFoodsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          dietaryRestrictions: [dietaryTypeSelection],
          customInstructions,
          userMedicalHistory: medicalHistoryParts.join(' | '),
          foodAllergies: allergyList,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.restructuredPlan) {
        throw new Error(data.error || 'Failed to restructure meal plan with preferred items.');
      }

      setRestructuredPlan(data.restructuredPlan);
      setCurrentStep('restructured');
    } catch (err: any) {
      console.error('Error restructuring plan:', err);
      setError(err.message || 'Failed to synthesize restructured meal plan.');
    } finally {
      setIsRestructuring(false);
    }
  };

  const handleAdoptPlan = () => {
    if (!restructuredPlan || !extractedPlan) return;

    const meals: MealSlot[] = (restructuredPlan.meals || []).map((m, idx) => {
      const items: MealItem[] = (m.items || []).map((it, itIdx) => ({
        id: `pdf_restructured_${Date.now()}_${idx}_${itIdx}`,
        name: it.food_item,
        servingSize: it.portion,
        quantity: 1,
        unit: 'serving',
        measurementType: 'count' as const,
        calories: Math.round(it.calories || m.calories / (m.items.length || 1)),
        protein: Math.round(it.protein_g || m.protein_g / (m.items.length || 1)),
        carbs: Math.round(it.carbs_g || m.carbs_g / (m.items.length || 1)),
        fats: Math.round(it.fats_g || m.fats_g / (m.items.length || 1)),
        category: 'Custom Restructured',
        isCustom: true,
      }));

      return {
        id: `slot_restructured_${Date.now()}_${idx}`,
        name: m.meal_name,
        time: m.target_time,
        items,
      };
    });

    const now = new Date().toISOString();
    const origSummary = extractedPlan.total_summary;
    const finalSummary = restructuredPlan.day_summary;

    const dietType: DietType = dietaryTypeSelection.includes('Vegan')
      ? 'Vegan'
      : dietaryTypeSelection.includes('Vegetarian')
      ? 'Vegetarian'
      : dietaryTypeSelection.includes('Eggetarian')
      ? 'Eggetarian'
      : 'Non-Vegetarian';

    const adoptedPlan: MealPlan = {
      id: `plan_restructured_${Date.now()}`,
      name: `Restructured: ${extractedPlan.plan_name || 'Imported Plan'} (${finalSummary.total_calories} kcal)`,
      userId: userEmail,
      userEmail: userEmail,
      targetCalories: finalSummary.total_calories,
      targetProtein: finalSummary.total_protein_g,
      targetCarbs: finalSummary.total_carbs_g,
      targetFats: finalSummary.total_fats_g,
      dietType,
      meals,
      createdBy: isCoachMode ? 'coach' : 'user',
      coachName: isCoachMode ? 'Coach Chinmay' : undefined,
      coachNotes: `Restructured from PDF "${fileName || 'uploaded document'}" on ${new Date().toLocaleDateString('en-IN')}. Original baseline: ${origSummary.total_calories} kcal (P:${origSummary.protein_g}g C:${origSummary.carbs_g}g F:${origSummary.fats_g}g). Restructured: ${finalSummary.total_calories} kcal (P:${finalSummary.total_protein_g}g C:${finalSummary.total_carbs_g}g F:${finalSummary.total_fats_g}g).`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Supabase in background
    saveMealPlanToSupabase({
      userId: userEmail,
      userEmail: userEmail,
      dailyCalories: finalSummary.total_calories,
      proteinG: finalSummary.total_protein_g,
      carbsG: finalSummary.total_carbs_g,
      fatsG: finalSummary.total_fats_g,
      planData: adoptedPlan,
    });

    onAdoptRestructuredPlan(adoptedPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  PDF Meal Plan Restructurer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Macro-Locked AI
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Upload an existing meal plan PDF. Extract its exact macro-calorie boundaries, then customize with your favorite foods.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Step Indicator */}
        <div className="px-6 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
          <div className="flex items-center space-x-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 'upload'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {currentStep !== 'upload' ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span className={currentStep === 'upload' ? 'text-indigo-900' : 'text-gray-700'}>
              Upload PDF Plan
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-300" />

          <div className="flex items-center space-x-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 'extracted'
                  ? 'bg-indigo-600 text-white'
                  : currentStep === 'restructured'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {currentStep === 'restructured' ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span className={currentStep === 'extracted' ? 'text-indigo-900' : 'text-gray-700'}>
              Choose Preferred Foods
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-300" />

          <div className="flex items-center space-x-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 'restructured' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              3
            </span>
            <span className={currentStep === 'restructured' ? 'text-indigo-900' : 'text-gray-400'}>
              Restructured Plan
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-xs">Action Failed</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: UPLOAD PDF */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl p-8 sm:p-12 text-center transition-all bg-indigo-50/30 hover:bg-indigo-50/60 cursor-pointer space-y-4 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-2xs">
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-gray-900">
                    {file ? file.name : 'Select or drag & drop your diet plan PDF'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Supports nutritionist charts, clinic PDF printouts, or coach diet plans. Gemini will accurately parse the meal schedules and calculate your total calories & macros.
                  </p>
                </div>

                {file && (
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{(file.size / (1024 * 1024)).toFixed(2)} MB PDF Ready</span>
                  </div>
                )}
              </div>

              {/* Pro-Tips Banner */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-start space-x-3 text-xs text-gray-600">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-900 block">How Macro-Locked Restructuring Works:</span>
                  <p>
                    1. Gemini extracts the target calories and protein/carb/fat split from your existing plan.
                  </p>
                  <p>
                    2. You specify what foods you want instead (e.g. replacing boiled chicken with paneer, or oatmeal with moong dal cheela).
                  </p>
                  <p>
                    3. The engine mathematically recalculates the new ingredients and weights so your daily totals stay within +/- 3% of the original PDF!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXTRACTED PLAN & FOOD SELECTION */}
          {currentStep === 'extracted' && extractedPlan && (
            <div className="space-y-6">
              {/* Extracted Macro Baseline Header */}
              <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-indigo-950 text-sm">
                        {extractedPlan.plan_name || 'Imported Meal Plan'}
                      </span>
                      {extractedPlan.diet_type && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-800 border border-indigo-200">
                          {extractedPlan.diet_type}
                        </span>
                      )}
                    </div>
                    {extractedPlan.detected_notes && (
                      <p className="text-[11px] text-indigo-700 italic">
                        {extractedPlan.detected_notes}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-indigo-900 bg-white/80 px-2.5 py-1 rounded-xl border border-indigo-200">
                    Source: {fileName}
                  </span>
                </div>

                {/* Locked Baseline Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Locked Calories</span>
                    <span className="text-lg font-black text-indigo-950">
                      {extractedPlan.total_summary.total_calories}
                    </span>
                    <span className="text-[10px] text-gray-500 block">kcal target</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Protein Target</span>
                    <span className="text-lg font-black text-blue-700">
                      {extractedPlan.total_summary.protein_g}g
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {extractedPlan.total_summary.protein_g * 4} kcal
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Carbs Target</span>
                    <span className="text-lg font-black text-amber-700">
                      {extractedPlan.total_summary.carbs_g}g
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {extractedPlan.total_summary.carbs_g * 4} kcal
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Fats Target</span>
                    <span className="text-lg font-black text-purple-700">
                      {extractedPlan.total_summary.fats_g}g
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {extractedPlan.total_summary.fats_g * 9} kcal
                    </span>
                  </div>
                </div>
              </div>

              {/* Original Meals Preview Accordion / Collapsible */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 block">
                  Extracted Original Meals ({extractedPlan.meals?.length || 0} meals detected):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {extractedPlan.meals?.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200/90 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{m.meal_name}</span>
                        <span className="text-[10px] text-gray-500">{m.target_time}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 line-clamp-2">
                        {(m.items || []).map((it) => `${it.food_item} (${it.portion})`).join(', ')}
                      </p>
                      <div className="text-[10px] font-semibold text-gray-500">
                        {m.calories} kcal | P: {m.protein_g}g | C: {m.carbs_g}g | F: {m.fats_g}g
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customization Controls for Restructuring */}
              <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-xs">
                <div className="flex items-center space-x-2 text-gray-900 font-bold text-xs pb-1 border-b border-gray-100">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Customize Your Restructured Plan</span>
                </div>

                {/* Disclosed Medical & Allergy Context Notice */}
                {medicalSynopsis && (medicalSynopsis.allergies.length > 0 || medicalSynopsis.injuriesOrSurgeries.length > 0 || medicalSynopsis.gutOrDigestiveIssues.length > 0) && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Safety Lock: Respecting Disclosed Medical Profile</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Food alternatives will strictly exclude contraindicated items to prevent adverse reactions.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {medicalSynopsis.allergies.map((allg, aIdx) => (
                        <span key={aIdx} className="px-2 py-0.5 rounded-md bg-red-100/80 text-red-900 font-semibold text-[10px] border border-red-200">
                          Allergy/Intolerance: {allg}
                        </span>
                      ))}
                      {medicalSynopsis.gutOrDigestiveIssues.map((gut, gIdx) => (
                        <span key={gIdx} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-[10px] border border-amber-200">
                          Digestive/Gut: {gut}
                        </span>
                      ))}
                      {medicalSynopsis.injuriesOrSurgeries.slice(0, 2).map((inj, iIdx) => (
                        <span key={iIdx} className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-semibold text-[10px] border border-blue-200">
                          Medical/Surgery: {inj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dietary Restriction / Style */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dietary Pattern for Replacement Foods
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'Gluten-Free'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDietaryTypeSelection(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          dietaryTypeSelection === type
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Food Items to Include */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Preferred Alternate Food Items to Include in the New Plan
                  </label>

                  {/* Selected Preferred Chips */}
                  <div className="flex flex-wrap gap-1.5 min-h-7">
                    {preferredFoodsList.map((food, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold"
                      >
                        <span>{food}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePreferredFood(food)}
                          className="text-indigo-400 hover:text-indigo-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Input field to add custom preferred food */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={preferredInput}
                      onChange={(e) => setPreferredInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPreferredFood(preferredInput);
                        }
                      }}
                      placeholder="Add food item (e.g. Soya chunks bhurji, peanut butter toast, chicken tikka)"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPreferredFood(preferredInput)}
                      className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Quick Suggestions Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-gray-400 font-medium">Quick suggestions:</span>
                    {COMMON_PREFERRED_FOODS.map((food, fIdx) => {
                      if (preferredFoodsList.includes(food)) return null;
                      return (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() => handleAddPreferredFood(food)}
                          className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-[11px] text-gray-600 transition-colors cursor-pointer"
                        >
                          + {food}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Disliked Foods to Replace / Exclude */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Foods in Current Plan You Dislike or Want Replaced (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={dislikedFoodsInput}
                    onChange={(e) => setDislikedFoodsInput(e.target.value)}
                    placeholder="e.g. Boiled chicken, raw salad without dressing, bland oats"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Specific Directives */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Specific Lifestyle or Cooking Directives <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Quick 10-minute breakfasts, high fiber for digestion, spicy Indian seasoning"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RESTRUCTURED PLAN PREVIEW */}
          {currentStep === 'restructured' && restructuredPlan && extractedPlan && (
            <div className="space-y-6">
              {/* Macro Comparison Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-950 text-sm">
                        Plan Successfully Restructured!
                      </span>
                      <p className="text-[11px] text-emerald-700">
                        {restructuredPlan.day_summary.macro_variance_notes || 'All macros locked within +/- 2% of original target.'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs">
                    {restructuredPlan.diet_type || 'Restructured Plan'}
                  </span>
                </div>

                {/* Macro Comparison Comparison Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Calories</span>
                    <span className="text-lg font-black text-emerald-900">
                      {restructuredPlan.day_summary.total_calories}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      Target: {extractedPlan.total_summary.total_calories} kcal
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Protein</span>
                    <span className="text-lg font-black text-blue-700">
                      {restructuredPlan.day_summary.total_protein_g}g
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      Target: {extractedPlan.total_summary.protein_g}g
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Carbohydrates</span>
                    <span className="text-lg font-black text-amber-700">
                      {restructuredPlan.day_summary.total_carbs_g}g
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      Target: {extractedPlan.total_summary.carbs_g}g
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Fats</span>
                    <span className="text-lg font-black text-purple-700">
                      {restructuredPlan.day_summary.total_fats_g}g
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      Target: {extractedPlan.total_summary.fats_g}g
                    </span>
                  </div>
                </div>
              </div>

              {/* Swaps Applied Summary */}
              {restructuredPlan.swaps_applied_summary && restructuredPlan.swaps_applied_summary.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                  <span className="font-bold text-xs text-indigo-950 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Food Substitutions Applied:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-indigo-900 font-medium">
                    {restructuredPlan.swaps_applied_summary.map((swap, sIdx) => (
                      <div key={sIdx} className="flex items-center space-x-1.5">
                        <span className="text-indigo-500">•</span>
                        <span>{swap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical & Allergy Safety Warnings (if any items triggered caution) */}
              {restructuredPlan.medical_safety_warnings && restructuredPlan.medical_safety_warnings.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Clinical Caution / Health Condition Impact Warnings</span>
                  </div>
                  <div className="space-y-1">
                    {restructuredPlan.medical_safety_warnings.map((warn, wIdx) => (
                      <div key={wIdx} className="text-xs text-amber-900 flex items-start space-x-1.5 bg-white/70 p-2 rounded-xl border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span className="leading-snug">{warn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Meals Display */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-700 block">Restructured Meal Breakdown:</span>
                {restructuredPlan.meals?.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gray-50/90 border border-gray-200/90 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-gray-900">{m.meal_name}</h4>
                        <span className="text-xs text-gray-500 font-medium flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          {m.target_time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-bold">
                        <span className="text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded-lg">
                          {m.calories} kcal
                        </span>
                        <span className="text-gray-600 bg-gray-200/60 px-2 py-0.5 rounded-lg text-[11px]">
                          P: {m.protein_g}g | C: {m.carbs_g}g | F: {m.fats_g}g
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {(m.items || []).map((it, itIdx) => (
                        <div
                          key={itIdx}
                          className={`flex flex-col p-2.5 rounded-xl border text-xs gap-1.5 shadow-2xs ${
                            it.medical_warning
                              ? 'bg-amber-50/60 border-amber-300'
                              : 'bg-white border-gray-200/80'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-gray-900">{it.food_item}</span>
                                {it.medical_warning && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                                    <ShieldAlert className="w-3 h-3 mr-0.5 text-amber-700" />
                                    Caution
                                  </span>
                                )}
                              </div>
                              {it.notes && <p className="text-[11px] text-gray-500 italic">{it.notes}</p>}
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 font-bold text-xs border border-indigo-100">
                                {it.portion}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium">
                                {it.calories} kcal (P:{it.protein_g}g)
                              </span>
                            </div>
                          </div>

                          {it.medical_warning && (
                            <div className="p-2 rounded-lg bg-amber-100/70 border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                              <span className="font-medium">{it.medical_warning}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          {currentStep === 'upload' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExtractFromPDF}
                disabled={!fileBase64 || isExtracting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Parsing PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Extract Plan & Macros</span>
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === 'extracted' && (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep('upload')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Back to Upload
              </button>
              <button
                type="button"
                onClick={handleRestructurePlan}
                disabled={isRestructuring}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
              >
                {isRestructuring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Restructuring with Alternatives...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Restructure Under Same Macros</span>
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === 'restructured' && (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep('extracted')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Adjust Preferences
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleRestructurePlan}
                  disabled={isRestructuring}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-white text-xs font-bold text-gray-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRestructuring ? 'animate-spin' : ''}`} />
                  <span>Regenerate Variations</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdoptPlan}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Adopt & Load into Editor</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
