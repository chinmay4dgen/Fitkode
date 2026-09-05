import React, { useState } from 'react';
import {
  Calendar,
  Camera,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import { WeeklyTrackerEntry } from '../types';

interface WeeklyTrackerTableProps {
  entries: WeeklyTrackerEntry[];
  onEdit?: (entry: WeeklyTrackerEntry) => void;
  onDelete?: (entryId: string) => void;
  onViewPhotos: (entryId: string) => void;
  isReadOnly?: boolean;
}

export default function WeeklyTrackerTable({
  entries,
  onEdit,
  onDelete,
  onViewPhotos,
  isReadOnly = false,
}: WeeklyTrackerTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  if (!entries || entries.length === 0) {
    return null;
  }

  // Ensure reverse chronological sorting (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
  );

  const toggleRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-light-green shadow-xs overflow-hidden">
      
      {/* Table Header Section */}
      <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-natural-oat/30">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center">
            <Calendar className="w-4 h-4 text-brand-green mr-2" />
            Weekly Health Statistics Log
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Standard tabular view arranged in reverse chronological order (latest check-ins on top)
          </p>
        </div>
        <div className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
          Showing {sortedEntries.length} recorded check-ins
        </div>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50/90 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="py-3.5 px-4">Date / Week</th>
              <th className="py-3.5 px-4">Weight (kg)</th>
              <th className="py-3.5 px-4">Waist (in)</th>
              <th className="py-3.5 px-4">Hips & Chest</th>
              <th className="py-3.5 px-4">Quads / Arm / Neck</th>
              <th className="py-3.5 px-4">Steps / Cal</th>
              <th className="py-3.5 px-4">Workouts</th>
              <th className="py-3.5 px-4 text-center">Photos</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedEntries.map((entry, index) => {
              // Calculate delta compared to the older check-in (index + 1 in reverse chronological list)
              const olderEntry = sortedEntries[index + 1];
              const weightDiff = olderEntry
                ? Number((entry.weightKg - olderEntry.weightKg).toFixed(1))
                : null;
              const waistDiff = olderEntry
                ? Number((entry.waistInches - olderEntry.waistInches).toFixed(1))
                : null;

              const photoCount = [
                entry.frontPicUrl,
                entry.leftPicUrl,
                entry.rightPicUrl,
                entry.backPicUrl,
              ].filter(Boolean).length;

              const isExpanded = expandedRowId === entry.id;

              return (
                <React.Fragment key={entry.id}>
                  <tr className="hover:bg-brand-light-green/10 transition-colors">
                    
                    {/* Date / Week */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-lg bg-brand-light-green text-brand-dark-green flex items-center justify-center font-bold text-xs">
                          W{entry.weekNumber || sortedEntries.length - index}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">
                            {new Date(entry.checkInDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(entry.checkInDate).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Weight with Delta */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="font-bold text-gray-900 text-sm">{entry.weightKg}</span>
                        <span className="text-[10px] text-gray-400">kg</span>
                      </div>
                      {weightDiff !== null && (
                        <div className="mt-0.5 flex items-center text-[10px]">
                          {weightDiff <= 0 ? (
                            <span className="text-emerald-600 font-bold flex items-center">
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                              {Math.abs(weightDiff)} kg
                            </span>
                          ) : (
                            <span className="text-blue-600 font-bold flex items-center">
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                              +{weightDiff} kg
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Waist with Delta */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-baseline space-x-1">
                        <span className="font-bold text-gray-900 text-sm">{entry.waistInches}</span>
                        <span className="text-[10px] text-gray-400">in</span>
                      </div>
                      {waistDiff !== null && (
                        <div className="mt-0.5 flex items-center text-[10px]">
                          {waistDiff <= 0 ? (
                            <span className="text-emerald-600 font-bold flex items-center">
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                              {Math.abs(waistDiff)}"
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center">
                              <TrendingUp className="w-3 h-3 mr-0.5" />
                              +{waistDiff}"
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Hips & Chest */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="text-xs text-gray-800">
                        <span className="text-gray-400 font-normal">Hips:</span> <strong>{entry.hipsInches}"</strong>
                      </p>
                      <p className="text-xs text-gray-800 mt-0.5">
                        <span className="text-gray-400 font-normal">Chest:</span> <strong>{entry.chestInches}"</strong>
                      </p>
                    </td>

                    {/* Quads / Arm / Neck */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="text-[11px] text-gray-700">
                        <span className="text-gray-400 font-normal">Quads:</span> {entry.quadsInches}" •{' '}
                        <span className="text-gray-400 font-normal">Arm:</span> {entry.upperRightArmInches}"
                      </p>
                      <p className="text-[11px] text-gray-700 mt-0.5">
                        <span className="text-gray-400 font-normal">Neck:</span> {entry.neckInches}"
                      </p>
                    </td>

                    {/* Steps / Calories */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="font-bold text-blue-700 text-xs">
                        {entry.avgStepsPerDay.toLocaleString()}{' '}
                        <span className="font-normal text-[10px] text-gray-500">steps</span>
                      </p>
                      <p className="text-amber-700 font-medium text-xs mt-0.5">
                        {entry.avgCaloriesPerDay.toLocaleString()}{' '}
                        <span className="font-normal text-[10px] text-gray-500">kcal</span>
                      </p>
                    </td>

                    {/* Workouts */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                          💪 {entry.resistanceWorkoutDays}d Resistance
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                          🏃 {entry.hiitCardioDays}d HIIT/Cardio
                        </span>
                      </div>
                    </td>

                    {/* Photos */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => onViewPhotos(entry.id)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          photoCount > 0
                            ? 'bg-brand-light-green text-brand-dark-green hover:bg-brand-green hover:text-white'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title="Inspect Front, Left, Right & Back Photos"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{photoCount}/4 Photos</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => toggleRow(entry.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="View challenges & details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        {!isReadOnly && onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(entry)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-green hover:bg-brand-light-green/30 transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {!isReadOnly && onDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this weekly check-in?')) {
                                onDelete(entry.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>

                  {/* Expanded Row for Challenges & Coach Notes */}
                  {isExpanded && (
                    <tr className="bg-gray-50/70 border-b border-gray-100 animate-in fade-in duration-150">
                      <td colSpan={9} className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
                          
                          {/* Challenges Faced */}
                          <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                            <p className="text-xs font-bold text-gray-800 flex items-center mb-1">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
                              Challenges Faced (Workout / Diet / Energy):
                            </p>
                            <p className="text-xs text-gray-600 italic">
                              {entry.challengesFaced ? `"${entry.challengesFaced}"` : 'No specific challenges reported for this week.'}
                            </p>
                          </div>

                          {/* Coach Feedback */}
                          <div className="bg-white p-3.5 rounded-xl border border-brand-green/30">
                            <p className="text-xs font-bold text-brand-dark-green flex items-center mb-1">
                              <MessageSquare className="w-3.5 h-3.5 text-brand-green mr-1.5" />
                              Coach Chinmay Review & Guidance:
                            </p>
                            <p className="text-xs text-gray-700">
                              {entry.coachFeedback || 'Pending review by Coach Chinmay.'}
                            </p>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
