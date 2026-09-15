import React, { useState } from 'react';
import { RefreshCw, Check, X, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { MealSlot, MealItem } from '../types';

interface MealSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: MealSlot;
  dietaryRestrictions?: string[];
  dislikesAndAllergies?: string[];
  onApplySwap: (newItems: MealItem[]) => void;
}

export default function MealSwapModal({
  isOpen,
  onClose,
  slot,
  dietaryRestrictions = ['Vegetarian'],
  dislikesAndAllergies = [],
  onApplySwap,
}: MealSwapModalProps) {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  // Calculate current slot totals
  const totalCalories = slot.items.reduce((acc, it) => acc + (it.calories || 0), 0);
  const totalProtein = slot.items.reduce((acc, it) => acc + (it.protein || 0), 0);
  const totalCarbs = slot.items.reduce((acc, it) => acc + (it.carbs || 0), 0);
  const totalFats = slot.items.reduce((acc, it) => acc + (it.fats || 0), 0);

  const handleFetchAlternatives = async () => {
    setLoading(true);
    setError(null);
    setSelectedIdx(null);

    try {
      const res = await fetch('/api/swap-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealName: slot.name,
          targetCalories: totalCalories || 450,
          targetProtein: totalProtein || 25,
          targetCarbs: totalCarbs || 50,
          targetFats: totalFats || 12,
          dietaryRestrictions,
          dislikesAndAllergies,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch swap alternatives');
      }

      setAlternatives(data.alternatives || []);
    } catch (err: any) {
      console.error('Error fetching meal swaps:', err);
      setError(err.message || 'Failed to generate swap alternatives');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSwap = () => {
    if (selectedIdx === null || !alternatives[selectedIdx]) return;
    const chosen = alternatives[selectedIdx];

    const newItems: MealItem[] = (chosen.items || []).map((it: any, idx: number) => ({
      id: `swap_item_${Date.now()}_${idx}`,
      name: it.food_item,
      servingSize: it.portion,
      quantity: 1,
      unit: 'serving',
      measurementType: 'count' as const,
      calories: Math.round(chosen.calories / (chosen.items.length || 1)),
      protein: Math.round(chosen.macros?.protein_g / (chosen.items.length || 1)),
      carbs: Math.round(chosen.macros?.carbs_g / (chosen.items.length || 1)),
      fats: Math.round(chosen.macros?.fats_g / (chosen.items.length || 1)),
      category: 'Indian Staples',
      isCustom: true,
    }));

    onApplySwap(newItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-white to-pink-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Swap Meal: {slot.name}</h3>
              <p className="text-xs text-gray-500">
                Target budget: ~{Math.round(totalCalories) || 450} kcal | P: {Math.round(totalProtein)}g | C: {Math.round(totalCarbs)}g | F: {Math.round(totalFats)}g
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {alternatives.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900">Need something different?</h4>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Click below to generate 3 chef-crafted, macro-matching alternative options for this meal slot using Gemini AI.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchAlternatives}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center space-x-2 mx-auto transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Finding Macro-Accurate Alternatives...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate 3 Alternatives</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-gray-700">Select an alternative to replace items:</span>
                <button
                  type="button"
                  onClick={handleFetchAlternatives}
                  disabled={loading}
                  className="text-purple-600 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              </div>

              {alternatives.map((alt, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedIdx(idx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-200'
                        : 'bg-white border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 text-xs">{alt.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-bold">
                        <span className="text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                          {alt.calories} kcal
                        </span>
                        <span className="text-gray-600">
                          P: {alt.macros?.protein_g}g | C: {alt.macros?.carbs_g}g | F: {alt.macros?.fats_g}g
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 pt-1 border-t border-gray-100">
                      {(alt.items || []).map((it: any, iIdx: number) => (
                        <div key={iIdx} className="flex items-center justify-between text-[11px] text-gray-600">
                          <span>• {it.food_item}</span>
                          <span className="font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                            {it.portion}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            Cancel
          </button>
          {alternatives.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmSwap}
              disabled={selectedIdx === null}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              <span>Apply Swap to Meal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
