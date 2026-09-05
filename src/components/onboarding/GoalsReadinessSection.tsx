import React from 'react';
import { Target, Sparkles, HelpCircle } from 'lucide-react';
import { ClientOnboarding } from '../../types';
import { ScaleRating } from './ScaleRating';

interface GoalsReadinessSectionProps {
  formData: ClientOnboarding;
  onFieldChange: (field: keyof ClientOnboarding, value: any) => void;
}

const HEALTH_GOALS = [
  'Weight Loss',
  'Weight Gain',
  'Bodybuilding with Aesthetics',
  'Powerlifting',
  'Sports Specific Performance Enhancement',
  'Others',
] as const;

export const GoalsReadinessSection: React.FC<GoalsReadinessSectionProps> = ({
  formData,
  onFieldChange,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="border-b border-gray-100 pb-5">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-light-green text-brand-dark-green text-xs font-bold uppercase tracking-wider mb-2">
          <Target className="w-3.5 h-3.5" />
          <span>Pre-Client Onboarding • Part 1 of 7</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center">
          1. Goals &amp; Readiness Assessment
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
          We shall discuss your fitness goals and evaluate how ready you are to commit towards achieving them.
        </p>
      </div>

      {/* Part A: Core Goals & Motivations */}
      <div className="space-y-6">
        {/* 5. Health Goal */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
            5. My health goal is <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">Select your primary fitness objective</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HEALTH_GOALS.map((goal) => {
              const isSelected = formData.healthGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => onFieldChange('healthGoal', goal)}
                  className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-brand-green bg-emerald-50/90 text-brand-dark-green shadow-xs ring-2 ring-brand-green/30'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="pr-2">{goal}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-brand-green bg-brand-green text-white' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </button>
              );
            })}
          </div>

          {formData.healthGoal === 'Others' && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Please specify your health goal:
              </label>
              <input
                type="text"
                required
                value={formData.healthGoalOther || ''}
                onChange={(e) => onFieldChange('healthGoalOther', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white"
                placeholder="e.g. Marathon endurance, post-rehab mobility, general longevity"
              />
            </div>
          )}
        </div>

        {/* 6. What is your core reason? What is your WHY? */}
        <div className="bg-natural-oat/40 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-gray-900 leading-snug">
            6. What is your core reason for this goal? What is your WHY? Please answer after careful thinking! <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your deepest psychological motive is what will keep you consistent during difficult weeks.
          </p>
          <textarea
            rows={3}
            required
            value={formData.coreReasonWhy}
            onChange={(e) => onFieldChange('coreReasonWhy', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white resize-none"
            placeholder="e.g. I want to build lifelong stamina, keep pace with my growing kids, prevent chronic family illnesses, and feel energized in my daily work."
          />
        </div>

        {/* 7. Past techniques, diets, behaviors */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1 leading-snug">
            7. In the past, I have tried the following techniques, diets, behaviors, etc. to reach my nutrition goals... <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={formData.pastDietsAndTechniques}
            onChange={(e) => onFieldChange('pastDietsAndTechniques', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white resize-none"
            placeholder="e.g. Keto for 2 months, intermittent fasting 16:8, calorie counting apps, GM diet, personal training sessions at local gym."
          />
        </div>

        {/* 8. Biggest challenges */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1 leading-snug">
            8. The biggest challenge(s) to reaching my nutrition goals is/are: <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={formData.biggestNutritionChallenges}
            onChange={(e) => onFieldChange('biggestNutritionChallenges', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white resize-none"
            placeholder="e.g. Frequent work travel, late social dinners, night sweet cravings, lack of meal prep time."
          />
        </div>

        {/* 9. Desired health & nutritional habit changes */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1 leading-snug">
            9. If I could change somethings about my health and nutritional habits, they would be... <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={formData.desiredHealthHabitChanges}
            onChange={(e) => onFieldChange('desiredHealthHabitChanges', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white resize-none"
            placeholder="e.g. Stop mindless snacking when stressed, drink 3 liters of water consistently, establish a regular 10 PM sleep schedule."
          />
        </div>
      </div>

      {/* Part B: Readiness & Commitment Scales (Questions 10-18) */}
      <div className="pt-6 border-t border-gray-100 space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-green text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Readiness &amp; Accountability Scales</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Commitment &amp; Willingness Evaluation (Questions 10 – 18)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Honest scores help Coach Chinmay pace your protocol for sustainable, injury-free adherence.
          </p>
        </div>

        <div className="space-y-3.5 pt-2">
          {/* 10. Truthful and honest */}
          <ScaleRating
            label="10. Rate how truthful and honest are you going to be with your health coach?"
            value={formData.truthfulnessScale || 5}
            onChange={(val) => onFieldChange('truthfulnessScale', val)}
            lowLabel="1 (Not honest)"
            highLabel="5 (Very honest)"
          />

          {/* 11. Weekly progress tracking */}
          <ScaleRating
            label="11. Are you ready to measure and track your progress Once every week and share the same with your Health Coach?"
            value={formData.readinessWeeklyTracking || 5}
            onChange={(val) => onFieldChange('readinessWeeklyTracking', val)}
            lowLabel="1 (Not willing)"
            highLabel="5 (Very willing)"
          />

          {/* 12. Modify diet */}
          <ScaleRating
            label="12. Are you ready to Significantly modify your diet?"
            value={formData.readinessModifyDiet || 4}
            onChange={(val) => onFieldChange('readinessModifyDiet', val)}
            lowLabel="1 (Not willing)"
            highLabel="5 (Very willing)"
          />

          {/* 13. Supplements */}
          <ScaleRating
            label="13. Are you ready to Take nutritional supplements each day if needed?"
            value={formData.readinessSupplements || 4}
            onChange={(val) => onFieldChange('readinessSupplements', val)}
            lowLabel="1 (Not willing)"
            highLabel="5 (Very willing)"
          />

          {/* 14. Daily food record */}
          <ScaleRating
            label="14. Are you ready to Keep a record of everything you eat each day?"
            value={formData.readinessFoodLog || 4}
            onChange={(val) => onFieldChange('readinessFoodLog', val)}
            lowLabel="1 (Not willing)"
            highLabel="5 (Very willing)"
          />

          {/* 15. Modify lifestyle */}
          <ScaleRating
            label="15. Are you ready to Modify your lifestyle (ex: work demands, sleep habits, physical activity)?"
            value={formData.readinessModifyLifestyle || 4}
            onChange={(val) => onFieldChange('readinessModifyLifestyle', val)}
            lowLabel="1 (Not willing)"
            highLabel="5 (Very willing)"
          />

          {/* 16. Relaxation / Meditation */}
          <ScaleRating
            label="16. Are you ready to Practice relaxation techniques as Meditation?"
            value={formData.readinessRelaxationMeditation || 4}
            onChange={(val) => onFieldChange('readinessRelaxationMeditation', val)}
            lowLabel="1 (Not willing)"
            highLabel="5 (Very willing)"
          />

          {/* 17. Regular exercise */}
          <ScaleRating
            label="17. Are you ready to Engage in regular exercise/physical activity?"
            value={formData.readinessRegularExercise || 5}
            onChange={(val) => onFieldChange('readinessRegularExercise', val)}
            lowLabel="1 (Not willing)"
            highLabel="5 (Very willing)"
          />

          {/* 18. Periodic lab tests */}
          <ScaleRating
            label="18. Are you ready to Have periodic lab tests to assess your progress?"
            value={formData.readinessPeriodicLabTests || 4}
            onChange={(val) => onFieldChange('readinessPeriodicLabTests', val)}
            lowLabel="1 (Not willing)"
            highLabel="5 (Very willing)"
          />
        </div>
      </div>
    </div>
  );
};
