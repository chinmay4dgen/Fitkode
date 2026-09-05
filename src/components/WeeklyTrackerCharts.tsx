import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Activity,
  Flame,
  Dumbbell,
  CheckCircle2,
  Scale,
  Ruler,
} from 'lucide-react';
import { WeeklyTrackerEntry } from '../types';

interface WeeklyTrackerChartsProps {
  entries: WeeklyTrackerEntry[];
}

export default function WeeklyTrackerCharts({ entries }: WeeklyTrackerChartsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<{
    weight: boolean;
    waist: boolean;
    hips: boolean;
    chest: boolean;
    quads: boolean;
    arm: boolean;
  }>({
    weight: true,
    waist: true,
    hips: false,
    chest: false,
    quads: false,
    arm: false,
  });

  if (!entries || entries.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-brand-light-green text-center">
        <Activity className="w-12 h-12 text-brand-green/40 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-800">No Weekly Check-ins Logged Yet</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
          Submit your first weekly check-in with morning body weight, tape measurements, steps, and photos to generate your visual transformation charts.
        </p>
      </div>
    );
  }

  // Sort chronological for charting (oldest -> newest)
  const sortedChrono = [...entries].sort(
    (a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
  );

  const baseline = sortedChrono[0];
  const latest = sortedChrono[sortedChrono.length - 1];

  const weightDelta = Number((latest.weightKg - baseline.weightKg).toFixed(1));
  const waistDelta = Number((latest.waistInches - baseline.waistInches).toFixed(1));
  const hipsDelta = Number((latest.hipsInches - baseline.hipsInches).toFixed(1));

  // Chart data formatting
  const chartData = sortedChrono.map((entry) => ({
    name: `W${entry.weekNumber || ''} (${new Date(entry.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
    date: entry.checkInDate,
    weight: entry.weightKg,
    waist: entry.waistInches,
    hips: entry.hipsInches,
    chest: entry.chestInches,
    quads: entry.quadsInches,
    arm: entry.upperRightArmInches,
    steps: entry.avgStepsPerDay,
    calories: entry.avgCaloriesPerDay,
    resistanceDays: entry.resistanceWorkoutDays,
    cardioDays: entry.hiitCardioDays,
  }));

  const toggleMetric = (key: keyof typeof selectedMetrics) => {
    setSelectedMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Weight KPI */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-light-green shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Weight Trajectory</span>
            <Scale className="w-4 h-4 text-brand-green" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{latest.weightKg}</span>
            <span className="text-xs text-gray-500">kg</span>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {weightDelta <= 0 ? (
              <span className="inline-flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
                {Math.abs(weightDelta)} kg lost
              </span>
            ) : (
              <span className="inline-flex items-center text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +{weightDelta} kg gained
              </span>
            )}
            <span className="text-gray-400 ml-1.5 text-[11px]">from baseline</span>
          </div>
        </div>

        {/* Waist KPI */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-light-green shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Waistline</span>
            <Ruler className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{latest.waistInches}</span>
            <span className="text-xs text-gray-500">inches</span>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {waistDelta <= 0 ? (
              <span className="inline-flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
                {Math.abs(waistDelta)}" reduced
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +{waistDelta}"
              </span>
            )}
            <span className="text-gray-400 ml-1.5 text-[11px]">from baseline</span>
          </div>
        </div>

        {/* Steps KPI */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-light-green shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Avg Daily Steps</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              {latest.avgStepsPerDay.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">steps/day</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span className="text-[11px]">
              {latest.avgStepsPerDay >= 10000
                ? '🔥 High activity tier (10k+)'
                : latest.avgStepsPerDay >= 8000
                ? '⚡ Optimal activity tier'
                : '🚶 Target: 8,000+'}
            </span>
          </div>
        </div>

        {/* Consistency KPI */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-light-green shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Check-in Consistency</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{entries.length}</span>
            <span className="text-xs text-gray-500">weekly logs</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {latest.resistanceWorkoutDays}d lifting • {latest.hiitCardioDays}d cardio
            </span>
          </div>
        </div>

      </div>

      {/* Main Chart: Body Weight & Measurements Over Time */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-brand-light-green shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center">
              <Scale className="w-4 h-4 text-brand-green mr-2" />
              Body Weight & Circumference Trends
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Weekly weigh-ins (empty stomach morning) and circumference measurements in inches
            </p>
          </div>

          {/* Metric Toggle Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggleMetric('weight')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedMetrics.weight
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Weight (kg)
            </button>
            <button
              type="button"
              onClick={() => toggleMetric('waist')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedMetrics.waist
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Waist (in)
            </button>
            <button
              type="button"
              onClick={() => toggleMetric('hips')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedMetrics.hips
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hips (in)
            </button>
            <button
              type="button"
              onClick={() => toggleMetric('chest')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedMetrics.chest
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chest (in)
            </button>
            <button
              type="button"
              onClick={() => toggleMetric('quads')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedMetrics.quads
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Quads (in)
            </button>
            <button
              type="button"
              onClick={() => toggleMetric('arm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedMetrics.arm
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Arm (in)
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#d1d5db"
              />
              <YAxis
                yAxisId="weight"
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#10b981' }}
                stroke="#10b981"
                unit=" kg"
              />
              <YAxis
                yAxisId="inches"
                orientation="right"
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#4b5563' }}
                stroke="#9ca3af"
                unit='"'
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {selectedMetrics.weight && (
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#059669"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
                />
              )}
              {selectedMetrics.waist && (
                <Line
                  yAxisId="inches"
                  type="monotone"
                  dataKey="waist"
                  name='Waist (")'
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              )}
              {selectedMetrics.hips && (
                <Line
                  yAxisId="inches"
                  type="monotone"
                  dataKey="hips"
                  name='Hips (")'
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
              {selectedMetrics.chest && (
                <Line
                  yAxisId="inches"
                  type="monotone"
                  dataKey="chest"
                  name='Chest (")'
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
              {selectedMetrics.quads && (
                <Line
                  yAxisId="inches"
                  type="monotone"
                  dataKey="quads"
                  name='Quads (")'
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
              {selectedMetrics.arm && (
                <Line
                  yAxisId="inches"
                  type="monotone"
                  dataKey="arm"
                  name='Upper Right Arm (")'
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Chart: Daily Steps & Caloric Intake */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-brand-light-green shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center">
              <Activity className="w-4 h-4 text-blue-600 mr-2" />
              Physical Activity & Caloric Nutrition Profile
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Weekly average daily steps and average daily calories reported
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-sm mr-1.5"></span>
              Steps / Day
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-amber-500 rounded-sm mr-1.5"></span>
              Calories / Day
            </span>
          </div>
        </div>

        <div className="w-full h-64 sm:h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
              <YAxis
                yAxisId="steps"
                tick={{ fontSize: 11, fill: '#3b82f6' }}
                stroke="#3b82f6"
                unit=" spd"
              />
              <YAxis
                yAxisId="calories"
                orientation="right"
                tick={{ fontSize: 11, fill: '#f59e0b' }}
                stroke="#f59e0b"
                unit=" kcal"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Bar yAxisId="steps" dataKey="steps" name="Avg Steps / Day" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="calories" dataKey="calories" name="Avg Calories / Day" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
