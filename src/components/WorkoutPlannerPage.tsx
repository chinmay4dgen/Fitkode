import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  ArrowLeft,
  Plus,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WorkoutPlan } from '../types';
import {
  loadUserWorkoutPlans,
  getActiveWorkoutPlan,
  saveWorkoutPlan,
  deleteWorkoutPlan,
  setActiveWorkoutPlan,
  renameWorkoutPlan,
  subscribeToPlannerUpdates,
} from '../lib/plannerStore';
import { createDefaultWorkoutPlan } from '../lib/plannerLibrary';
import WorkoutPlannerView from './WorkoutPlannerView';
import { ToastContainer, ToastMessage } from './Toast';

export default function WorkoutPlannerPage() {
  const { user, isAdmin, isPaid } = useAuth();
  const navigate = useNavigate();

  const userEmail = user?.email || 'guest@fitkode.ai';
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    userEmail.split('@')[0] ||
    'Member';

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id, duration: toast.duration || 4500 }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load plans on mount / user change & subscribe to updates
  useEffect(() => {
    const sync = () => {
      const loaded = loadUserWorkoutPlans(userEmail);
      setPlans(loaded);
      setActivePlanId((curr) => {
        if (curr && loaded.some((p) => p.id === curr)) return curr;
        const active = getActiveWorkoutPlan(userEmail);
        return active ? active.id : (loaded[0]?.id || '');
      });
    };
    sync();
    const unsubscribe = subscribeToPlannerUpdates(sync);
    return () => unsubscribe();
  }, [userEmail]);

  const currentPlan = plans.find((p) => p.id === activePlanId) || plans[0] || null;

  const handleRenamePlan = async (planId: string, newName: string) => {
    try {
      const updatedList = await renameWorkoutPlan(planId, newName, userEmail);
      setPlans(updatedList);
      addToast({
        type: 'success',
        title: 'Workout Routine Renamed',
        message: `Plan renamed to "${newName}".`,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Rename Failed',
        message: 'Could not rename workout plan.',
      });
    }
  };

  const handleSavePlan = async (updatedPlan: WorkoutPlan) => {
    try {
      const updatedList = await saveWorkoutPlan(updatedPlan);
      setPlans(updatedList);
      setActivePlanId(updatedPlan.id);
      addToast({
        type: 'success',
        title: 'Workout Plan Saved',
        message: `"${updatedPlan.name}" is saved to your profile.`,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save workout plan.',
      });
    }
  };

  const handleCreateNewPlan = () => {
    const newPlan = createDefaultWorkoutPlan(userEmail, false);
    newPlan.id = `workout_custom_${Date.now()}`;
    newPlan.name = `Personal Training Split #${plans.length + 1}`;
    newPlan.createdBy = 'user';
    newPlan.coachName = undefined;
    newPlan.coachNotes = undefined;

    setPlans((prev) => [newPlan, ...prev]);
    setActivePlanId(newPlan.id);
    addToast({
      type: 'info',
      title: 'New Workout Routine Created',
      message: 'Configure your days, sets, and exercises.',
    });
  };

  const handleSelectPlan = async (planId: string) => {
    setActivePlanId(planId);
    if (user?.email) {
      const updatedList = await setActiveWorkoutPlan(planId, user.email);
      setPlans(updatedList);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (plans.length <= 1) {
      addToast({
        type: 'error',
        title: 'Cannot Delete Only Plan',
        message: 'You need at least one active workout routine.',
      });
      return;
    }
    const updatedList = await deleteWorkoutPlan(planId, userEmail);
    setPlans(updatedList);
    if (activePlanId === planId) {
      setActivePlanId(updatedList[0]?.id || '');
    }
    addToast({
      type: 'info',
      title: 'Workout Routine Deleted',
      message: 'Routine was removed from your profile.',
    });
  };

  const handleDuplicatePlan = async (sourcePlan: WorkoutPlan) => {
    const cloned: WorkoutPlan = {
      ...JSON.parse(JSON.stringify(sourcePlan)),
      id: `workout_copy_${Date.now()}`,
      name: `${sourcePlan.name} (Copy)`,
      createdBy: 'user',
      coachName: undefined,
      coachNotes: undefined,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedList = await saveWorkoutPlan(cloned);
    setPlans(updatedList);
    addToast({
      type: 'info',
      title: 'Routine Cloned',
      message: `Created copy "${cloned.name}".`,
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
              to="/meal-planner"
              className="py-1.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-xs transition-colors flex items-center space-x-1"
            >
              <span>Switch to Meal Planner</span>
            </Link>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="bg-gradient-to-r from-purple-950 to-indigo-950 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-purple-500/30 text-purple-300">
                <Dumbbell className="w-4 h-4" />
              </span>
              <h1 className="text-lg font-bold text-white">Workout & Resistance Training Planner</h1>
            </div>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              Build and customize your weekly training splits. If Coach Chinmay has assigned a
              custom workout regimen to your account, it appears here automatically. You can also
              self-create custom routines using the Fitkode Exercise Database.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNewPlan}
            className="py-2.5 px-4 rounded-xl bg-white text-purple-950 hover:bg-purple-50 font-bold text-xs shadow-sm transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Routine</span>
          </button>
        </div>

        {/* Main View */}
        <WorkoutPlannerView
          currentPlan={currentPlan}
          allPlans={plans}
          userEmail={userEmail}
          userName={userName}
          isCoachMode={false}
          onSavePlan={handleSavePlan}
          onSelectPlan={handleSelectPlan}
          onSetActivePlan={handleSelectPlan}
          onCreateNewPlan={handleCreateNewPlan}
          onDeletePlan={handleDeletePlan}
          onDuplicatePlan={handleDuplicatePlan}
          onRenamePlan={handleRenamePlan}
        />
      </div>
    </div>
  );
}
