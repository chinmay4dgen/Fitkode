import React from 'react';
import { HeartPulse, Dumbbell, Moon, Wind, Coffee, Zap } from 'lucide-react';
import { ClientOnboarding } from '../../types';
import { ScaleRating } from './ScaleRating';

interface LifestyleHabitsSectionProps {
  formData: ClientOnboarding;
  onFieldChange: (field: keyof ClientOnboarding, value: any) => void;
  onToggleArray: (field: keyof ClientOnboarding, item: string) => void;
}

const PHYSICAL_ACTIVITY_OPTIONS = [
  'Stretching/ Yoga',
  'Cardio/ Aerobis (Walking, Jogging, Cycling, swimming, etc)',
  'Strength Training (Homeworkouts, Weight lifting, pilates, calisthenics, power yoga)',
  'Any sports activity (tennis, cricket, football, etc)',
  'None',
  'Other',
];

const LIMITATION_OPTIONS = [
  'Work',
  'Family',
  'Social Life',
  'Financial Consideration',
  'Health',
  'Other',
];

export const LifestyleHabitsSection: React.FC<LifestyleHabitsSectionProps> = ({
  formData,
  onFieldChange,
  onToggleArray,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Section Header */}
      <div className="border-b border-gray-100 pb-5">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-light-green text-brand-dark-green text-xs font-bold uppercase tracking-wider mb-2">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Pre-Client Onboarding • Part 2 of 7</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center">
          2. Lifestyle, Physical Activity &amp; Stress Assessment
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
          Questions 19 – 38: Assessing current movement patterns, workout environments, daily stress levels, sleep hygiene, and recreational habits.
        </p>
      </div>

      {/* Part A: Movement & Physical Activity (Q19 - Q24) */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-brand-green text-xs font-bold uppercase tracking-wider">
          <Dumbbell className="w-4 h-4" />
          <span>Physical Activity &amp; Training Routine</span>
        </div>

        {/* 19. Current Physical Activities */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1 leading-snug">
            19. Currently pursuing any physical activity? (Tick all that apply) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            {PHYSICAL_ACTIVITY_OPTIONS.map((activity) => {
              const isChecked = (formData.currentPhysicalActivities || []).includes(activity);
              return (
                <button
                  key={activity}
                  type="button"
                  onClick={() => onToggleArray('currentPhysicalActivities', activity)}
                  className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'border-brand-green bg-emerald-50 text-brand-dark-green shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <span className="pr-2">{activity}</span>
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'border-brand-green bg-brand-green text-white' : 'border-gray-300'
                    }`}
                  >
                    {isChecked && <span className="text-[10px]">✓</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {(formData.currentPhysicalActivities || []).includes('Other') && (
            <input
              type="text"
              value={formData.currentPhysicalActivitiesOther || ''}
              onChange={(e) => onFieldChange('currentPhysicalActivitiesOther', e.target.value)}
              className="mt-3 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white"
              placeholder="Please describe your other physical activity"
            />
          )}
        </div>

        {/* 20 & 21. Days per week & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              20. How many days a week do you pursue these activities? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.physicalActivityDaysPerWeek ?? 0}
              onChange={(e) => onFieldChange('physicalActivityDaysPerWeek', Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d === 0 ? '0 days (Sedentary / None)' : `${d} day${d > 1 ? 's' : ''} per week`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              21. Duration per session (in minutes)? <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="240"
              value={formData.physicalActivityDurationMinutes ?? 0}
              onChange={(e) => onFieldChange('physicalActivityDurationMinutes', Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
              placeholder="e.g. 45"
            />
          </div>
        </div>

        {/* 22. Gym Access */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
            22. Do you have access to a gym? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { val: 'yes', label: 'Yes, full gym access' },
              { val: 'no', label: 'No gym access' },
              { val: 'will prefer homeworkouts', label: 'Prefer Home Workouts' },
            ].map((opt) => (
              <label
                key={opt.val}
                className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center space-x-3 cursor-pointer transition-all ${
                  formData.gymAccess === opt.val
                    ? 'border-brand-green bg-emerald-50 text-brand-dark-green ring-1 ring-brand-green'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="gymAccess"
                  checked={formData.gymAccess === opt.val}
                  onChange={() => onFieldChange('gymAccess', opt.val)}
                  className="text-brand-green focus:ring-brand-green"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 23. How many days in a week can you work out and for how long? */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
            23. How many days in a week can you work out and for how long? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.workoutDaysAndDuration || ''}
            onChange={(e) => onFieldChange('workoutDaysAndDuration', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
            placeholder="e.g. 4 to 5 days a week for 45-60 minutes"
          />
        </div>

        {/* 24. What limits you from being physically active? */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1 leading-snug">
            24. What limits you from being physically active? (Tick all that apply) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
            {LIMITATION_OPTIONS.map((item) => {
              const isChecked = (formData.physicalActivityLimitations || []).includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggleArray('physicalActivityLimitations', item)}
                  className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'border-brand-green bg-emerald-50 text-brand-dark-green shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <span>{item}</span>
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'border-brand-green bg-brand-green text-white' : 'border-gray-300'
                    }`}
                  >
                    {isChecked && <span className="text-[10px]">✓</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {(formData.physicalActivityLimitations || []).includes('Other') && (
            <input
              type="text"
              value={formData.physicalActivityLimitationsOther || ''}
              onChange={(e) => onFieldChange('physicalActivityLimitationsOther', e.target.value)}
              className="mt-3 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white"
              placeholder="Please specify any other limitation"
            />
          )}
        </div>
      </div>

      {/* Part B: Stress Level Assessment (Q25 - Q30) */}
      <div className="pt-6 border-t border-gray-100 space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-green text-xs font-bold uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Stress &amp; Cortisol Triggers</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Stress Assessment (Questions 25 – 30)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Rate your stress on a scale of 1 (Extremely Low) to 5 (Very High) across key life areas.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* 25. Work stress */}
          <ScaleRating
            label="25. Stress due to Work"
            value={formData.stressWork || 3}
            onChange={(val) => onFieldChange('stressWork', val)}
            lowLabel="1 (Extremely Low)"
            highLabel="5 (Very High)"
          />

          {/* 26. Family stress */}
          <ScaleRating
            label="26. Stress due to Family"
            value={formData.stressFamily || 2}
            onChange={(val) => onFieldChange('stressFamily', val)}
            lowLabel="1 (Extremely Low)"
            highLabel="5 (Very High)"
          />

          {/* 27. Social stress */}
          <ScaleRating
            label="27. Stress due to Social Life"
            value={formData.stressSocial || 2}
            onChange={(val) => onFieldChange('stressSocial', val)}
            lowLabel="1 (Extremely Low)"
            highLabel="5 (Very High)"
          />

          {/* 28. Financial stress */}
          <ScaleRating
            label="28. Stress due to Financial Considerations"
            value={formData.stressFinancial || 2}
            onChange={(val) => onFieldChange('stressFinancial', val)}
            lowLabel="1 (Extremely Low)"
            highLabel="5 (Very High)"
          />

          {/* 29. Health stress */}
          <ScaleRating
            label="29. Stress due to Health Considerations"
            value={formData.stressHealth || 2}
            onChange={(val) => onFieldChange('stressHealth', val)}
            lowLabel="1 (Extremely Low)"
            highLabel="5 (Very High)"
          />

          {/* 30. Stress due to anything else */}
          <div className="bg-natural-oat/50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
            <ScaleRating
              label="30. Stress due to Anything Else?"
              value={formData.stressOtherScore || 1}
              onChange={(val) => onFieldChange('stressOtherScore', val)}
              lowLabel="1 (Extremely Low)"
              highLabel="5 (Very High)"
            />
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                If applicable, describe what else causes stress:
              </label>
              <input
                type="text"
                value={formData.stressOtherDetail || ''}
                onChange={(e) => onFieldChange('stressOtherDetail', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white"
                placeholder="e.g. Commuting traffic, exam preparations, shifting homes"
              />
            </div>
          </div>
        </div>

        {/* 31. Unwind & Relax Activities */}
        <div className="pt-2">
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1 leading-snug">
            31. What helps you unwind and relax? <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={formData.unwindRelaxActivities || ''}
            onChange={(e) => onFieldChange('unwindRelaxActivities', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green bg-white resize-none"
            placeholder="e.g. Evening walk in nature, reading fiction books, listening to acoustic music, playing video games."
          />
        </div>
      </div>

      {/* Part C: Sleep Hygiene (Q32 - Q33) */}
      <div className="pt-6 border-t border-gray-100 space-y-4">
        <div className="flex items-center space-x-2 text-brand-green text-xs font-bold uppercase tracking-wider">
          <Moon className="w-4 h-4" />
          <span>Sleep Hygiene &amp; Recovery Hours</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              32. Sleep hours on Weekdays? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.sleepHoursWeekdays || ''}
              onChange={(e) => onFieldChange('sleepHoursWeekdays', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
              placeholder="e.g. 6.5 to 7 hours"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              33. Sleep hours on Weekends? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.sleepHoursWeekends || ''}
              onChange={(e) => onFieldChange('sleepHoursWeekends', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
              placeholder="e.g. 8 to 8.5 hours"
            />
          </div>
        </div>
      </div>

      {/* Part D: Tobacco & Alcohol Habits (Q34 - Q38) */}
      <div className="pt-6 border-t border-gray-100 space-y-4">
        <div className="flex items-center space-x-2 text-brand-green text-xs font-bold uppercase tracking-wider">
          <Wind className="w-4 h-4" />
          <span>Smoking &amp; Alcohol Consumption Baseline</span>
        </div>

        {/* 34 & 35. Smoking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              34. Do you smoke? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.smokingStatus || 'Never'}
              onChange={(e) => onFieldChange('smokingStatus', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="Never">Never</option>
              <option value="In the past">In the past</option>
              <option value="Regularly">Regularly</option>
              <option value="Occasionally">Occasionally</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              35. How many cigarettes a day? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.cigarettesPerDay || 'Am a non smoker'}
              onChange={(e) => onFieldChange('cigarettesPerDay', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="Am a non smoker">Am a non smoker</option>
              <option value="1">1</option>
              <option value="2-4">2 - 4</option>
              <option value="4-6">4 - 6</option>
              <option value="6+">6+</option>
            </select>
          </div>
        </div>

        {/* 36, 37, 38. Alcohol */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              36. Alcohol use? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.alcoholUse || 'Never'}
              onChange={(e) => onFieldChange('alcoholUse', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="Never">Never</option>
              <option value="In the past">In the past</option>
              <option value="Regularly">Regularly</option>
              <option value="Occasionally">Occasionally</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              37. Alcohol frequency? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.alcoholFrequency || 'Never'}
              onChange={(e) => onFieldChange('alcoholFrequency', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="Never">Never</option>
              <option value="In the past">In the past</option>
              <option value="Once a Month">Once a Month</option>
              <option value="Once a Week">Once a Week</option>
              <option value="Multiple Times a week">Multiple Times a week</option>
              <option value="Daily">Daily</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1">
              38. Quantity per session? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.alcoholQuantityPerSession || 'Not Applicable'}
              onChange={(e) => onFieldChange('alcoholQuantityPerSession', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
            >
              <option value="Not Applicable">Not Applicable</option>
              <option value="30 ml">30 ml</option>
              <option value="60 ml">60 ml</option>
              <option value="90 ml">90 ml</option>
              <option value="120 ml">120 ml</option>
              <option value="120ml +">120 ml +</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
