import React, { useState, useEffect } from 'react';
import { X, Edit3, Plus, Sparkles, Utensils, Dumbbell } from 'lucide-react';
import { DietType, WorkoutGoal } from '../types';

interface RenamePlanModalProps {
  isOpen: boolean;
  title?: string;
  currentName: string;
  planType?: 'meal' | 'workout';
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const RenamePlanModal: React.FC<RenamePlanModalProps> = ({
  isOpen,
  title = 'Rename Plan',
  currentName,
  planType = 'meal',
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(currentName);
    setError('');
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a valid plan name.');
      return;
    }
    onSave(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${
                planType === 'meal'
                  ? 'bg-brand-light-green/70 text-brand-dark-green'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              <Edit3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Plan Title
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder={planType === 'meal' ? 'e.g. Lean Bulk 2400 kcal Diet' : 'e.g. Hypertrophy 4-Day Split'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none"
            />
            {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer ${
                planType === 'meal'
                  ? 'bg-brand-green hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              Save New Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CreatePlanModalProps {
  isOpen: boolean;
  planType: 'meal' | 'workout';
  onClose: () => void;
  onCreate: (name: string, meta: { dietType?: DietType; calories?: number; goal?: WorkoutGoal }) => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  planType,
  onClose,
  onCreate,
}) => {
  const isMeal = planType === 'meal';
  const [name, setName] = useState('');
  const [dietType, setDietType] = useState<DietType>('Vegetarian');
  const [calories, setCalories] = useState<number>(2000);
  const [goal, setGoal] = useState<WorkoutGoal>('Hypertrophy & Muscle Gain');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(isMeal ? 'Custom Nutrition Plan' : 'Custom Workout Routine');
      setError('');
    }
  }, [isOpen, isMeal]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a custom plan name.');
      return;
    }
    onCreate(name.trim(), {
      dietType: isMeal ? dietType : undefined,
      calories: isMeal ? calories : undefined,
      goal: !isMeal ? goal : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isMeal ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {isMeal ? <Utensils className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {isMeal ? 'Create Custom Meal Plan' : 'Create Custom Workout Routine'}
              </h3>
              <p className="text-xs text-gray-500">
                Design a custom protocol tailored to specific goals and preferences.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Custom Plan Name *
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                isMeal
                  ? 'e.g. High-Protein Fat Loss (1900 kcal)'
                  : 'e.g. Push Pull Legs Hypertrophy Split'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none"
            />
            {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
          </div>

          {isMeal ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Dietary Preference
                </label>
                <select
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value as DietType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Keto">Keto</option>
                  <option value="Low-Carb">Low-Carb</option>
                  <option value="High-Protein Balanced">High-Protein Balanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Calories (kcal)
                </label>
                <input
                  type="number"
                  min={1000}
                  max={5000}
                  step={50}
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value) || 2000)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Training Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as WorkoutGoal)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 outline-none"
              >
                <option value="Hypertrophy & Muscle Gain">Hypertrophy & Muscle Gain</option>
                <option value="Fat Loss & Conditioning">Fat Loss & Conditioning</option>
                <option value="Strength & Power">Strength & Power</option>
                <option value="General Fitness & Longevity">General Fitness & Longevity</option>
                <option value="Athletic Conditioning">Athletic Conditioning</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer flex items-center space-x-1.5 ${
                isMeal
                  ? 'bg-brand-green hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
