import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Utensils,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  User,
  Plus,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MealPlan } from '../types';
import {
  loadUserMealPlans,
  getActiveMealPlan,
  saveMealPlan,
  deleteMealPlan,
  setActiveMealPlan,
} from '../lib/plannerStore';
import { createDefaultVegDietPlan } from '../lib/plannerLibrary';
import MealPlannerView from './MealPlannerView';
import { ToastContainer, ToastMessage } from './Toast';

export default function MealPlannerPage() {
  const { user, isAdmin, isPaid } = useAuth();
  const navigate = useNavigate();

  const userEmail = user?.email || 'guest@fitkode.ai';
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    userEmail.split('@')[0] ||
    'Member';

  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id, duration: toast.duration || 4500 }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load plans on mount / user change
  useEffect(() => {
    const loaded = loadUserMealPlans(userEmail);
    setPlans(loaded);
    const active = getActiveMealPlan(userEmail);
    if (active) {
      setActivePlanId(active.id);
    } else if (loaded.length > 0) {
      setActivePlanId(loaded[0].id);
    }
  }, [userEmail]);

  const currentPlan = plans.find((p) => p.id === activePlanId) || plans[0] || null;

  const handleSavePlan = async (updatedPlan: MealPlan) => {
    try {
      const updatedList = await saveMealPlan(updatedPlan);
      setPlans(updatedList);
      setActivePlanId(updatedPlan.id);
      addToast({
        type: 'success',
        title: 'Meal Plan Saved',
        message: `"${updatedPlan.name}" is saved to your profile.`,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save meal plan.',
      });
    }
  };

  const handleCreateNewPlan = () => {
    const newPlan = createDefaultVegDietPlan(userEmail, false);
    newPlan.id = `diet_custom_${Date.now()}`;
    newPlan.name = `Personal Diet Plan #${plans.length + 1}`;
    newPlan.createdBy = 'user';
    newPlan.coachName = undefined;
    newPlan.coachNotes = undefined;

    setPlans((prev) => [newPlan, ...prev]);
    setActivePlanId(newPlan.id);
    addToast({
      type: 'info',
      title: 'New Meal Plan Created',
      message: 'Configure your target macros and meals.',
    });
  };

  const handleSelectPlan = async (planId: string) => {
    setActivePlanId(planId);
    if (user?.email) {
      const updatedList = await setActiveMealPlan(planId, user.email);
      setPlans(updatedList);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (plans.length <= 1) {
      addToast({
        type: 'error',
        title: 'Cannot Delete Only Plan',
        message: 'You need at least one active meal plan.',
      });
      return;
    }
    const updatedList = await deleteMealPlan(planId, userEmail);
    setPlans(updatedList);
    if (activePlanId === planId) {
      setActivePlanId(updatedList[0]?.id || '');
    }
    addToast({
      type: 'info',
      title: 'Meal Plan Deleted',
      message: 'Plan was removed from your profile.',
    });
  };

  return (
    <div className="min-h-screen bg-natural-oat py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-brand-green transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Profile</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Link
              to="/workout-planner"
              className="py-1.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-xs transition-colors flex items-center space-x-1"
            >
              <span>Switch to Workout Planner</span>
            </Link>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/30 text-emerald-300">
                <Utensils className="w-4 h-4" />
              </span>
              <h1 className="text-lg font-bold text-white">Interactive Meal & Nutrition Planner</h1>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Design and adjust daily nutrition schedules. If Coach Chinmay has assigned a tailored
              diet plan to your account, it appears here automatically. You can also self-create
              unlimited custom meal plans using the Fitkode Food Library.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNewPlan}
            className="py-2.5 px-4 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs shadow-sm transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>

        {/* Main View */}
        <MealPlannerView
          currentPlan={currentPlan}
          allPlans={plans}
          userEmail={userEmail}
          userName={userName}
          isCoachMode={false}
          onSavePlan={handleSavePlan}
          onSelectPlan={handleSelectPlan}
          onCreateNewPlan={handleCreateNewPlan}
          onDeletePlan={handleDeletePlan}
        />
      </div>
    </div>
  );
}
