import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Sparkles, Calendar, ArrowRightLeft } from 'lucide-react';
import { WeeklyTrackerEntry } from '../types';

interface PhotoCompareModalProps {
  entries: WeeklyTrackerEntry[];
  initialEntryId?: string;
  onClose: () => void;
}

export default function PhotoCompareModal({
  entries,
  initialEntryId,
  onClose,
}: PhotoCompareModalProps) {
  const [selectedPose, setSelectedPose] = useState<'front' | 'left' | 'right' | 'back'>('front');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  
  // Base entry (e.g. current or selected)
  const initialIdx = entries.findIndex((e) => e.id === initialEntryId);
  const [primaryIndex, setPrimaryIndex] = useState(initialIdx >= 0 ? initialIdx : 0);
  // Comparison entry (default to oldest / baseline entry if available)
  const [secondaryIndex, setSecondaryIndex] = useState(
    entries.length > 1 ? entries.length - 1 : 0
  );

  const primaryEntry = entries[primaryIndex] || entries[0];
  const secondaryEntry = entries[secondaryIndex] || entries[entries.length - 1];

  const getPoseUrl = (entry: WeeklyTrackerEntry, pose: 'front' | 'left' | 'right' | 'back') => {
    switch (pose) {
      case 'front':
        return entry.frontPicUrl;
      case 'left':
        return entry.leftPicUrl;
      case 'right':
        return entry.rightPicUrl;
      case 'back':
        return entry.backPicUrl;
    }
  };

  const poseLabels = {
    front: 'Front Pose',
    left: 'Left Profile (90°)',
    right: 'Right Profile (90°)',
    back: 'Back Pose (Lat/Bicep)',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 text-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Member Progression Photo Gallery
              </h3>
              <p className="text-xs text-gray-400">
                Weekly visual body composition logs & transformation review
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  compareMode
                    ? 'bg-brand-green text-white shadow-xs'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{compareMode ? 'Single Week View' : 'Compare Before & After'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pose Selection Tabs */}
        <div className="px-6 py-3 bg-gray-900/90 border-b border-gray-800/80 flex items-center justify-center space-x-2 shrink-0 overflow-x-auto">
          {(['front', 'left', 'right', 'back'] as const).map((pose) => {
            const isActive = selectedPose === pose;
            return (
              <button
                key={pose}
                type="button"
                onClick={() => setSelectedPose(pose)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-brand-green text-white shadow-xs'
                    : 'bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {poseLabels[pose]}
              </button>
            );
          })}
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center">
          {!compareMode ? (
            /* Single Week View */
            <div className="max-w-xl mx-auto w-full flex flex-col items-center">
              {/* Week Navigation */}
              <div className="flex items-center justify-between w-full mb-4 bg-gray-950/40 p-2 rounded-2xl border border-gray-800">
                <button
                  type="button"
                  disabled={primaryIndex >= entries.length - 1}
                  onClick={() => setPrimaryIndex((prev) => Math.min(entries.length - 1, prev + 1))}
                  className="p-2 rounded-xl hover:bg-gray-800 disabled:opacity-30 text-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Older check-in"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-full">
                    Week {primaryEntry?.weekNumber || primaryIndex + 1}
                  </span>
                  <p className="text-sm font-semibold text-white mt-1">
                    {primaryEntry ? new Date(primaryEntry.checkInDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }) : ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    Weight: <strong className="text-white">{primaryEntry?.weightKg} kg</strong> | Waist: <strong className="text-white">{primaryEntry?.waistInches}"</strong>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={primaryIndex <= 0}
                  onClick={() => setPrimaryIndex((prev) => Math.max(0, prev - 1))}
                  className="p-2 rounded-xl hover:bg-gray-800 disabled:opacity-30 text-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Newer check-in"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Display */}
              <div className="w-full aspect-[3/4] max-h-[55vh] rounded-2xl overflow-hidden bg-black/50 border border-gray-800 flex items-center justify-center relative shadow-inner">
                {getPoseUrl(primaryEntry, selectedPose) ? (
                  <img
                    src={getPoseUrl(primaryEntry, selectedPose)}
                    alt={`${poseLabels[selectedPose]} - Week ${primaryEntry.weekNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <p className="text-sm font-semibold">No photo uploaded for {poseLabels[selectedPose]}</p>
                    <p className="text-xs mt-1 text-gray-600">Client did not attach a photo for this pose.</p>
                  </div>
                )}
                
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-medium text-gray-300 border border-white/10">
                  {poseLabels[selectedPose]}
                </div>
              </div>

              {primaryEntry?.challengesFaced && (
                <div className="w-full mt-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-xs text-gray-300">
                  <span className="font-bold text-gray-200">Notes / Challenges: </span>
                  {primaryEntry.challengesFaced}
                </div>
              )}
            </div>
          ) : (
            /* Side-by-Side Comparison Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Secondary (Earlier / Before) */}
              <div className="flex flex-col items-center bg-gray-950/40 p-4 rounded-2xl border border-gray-800">
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                    Reference / Earlier
                  </span>
                  <select
                    value={secondaryIndex}
                    onChange={(e) => setSecondaryIndex(Number(e.target.value))}
                    className="bg-gray-800 text-xs text-white px-2.5 py-1.5 rounded-lg border border-gray-700 focus:outline-none"
                  >
                    {entries.map((entry, idx) => (
                      <option key={entry.id} value={idx}>
                        Week {entry.weekNumber} ({entry.checkInDate}) - {entry.weightKg}kg
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full aspect-[3/4] max-h-[48vh] rounded-xl overflow-hidden bg-black/60 border border-gray-800 flex items-center justify-center relative shadow-inner">
                  {getPoseUrl(secondaryEntry, selectedPose) ? (
                    <img
                      src={getPoseUrl(secondaryEntry, selectedPose)}
                      alt={`Reference Week ${secondaryEntry.weekNumber}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-500 text-xs">No photo available</div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs px-2.5 py-0.5 rounded text-[11px] font-bold text-amber-400">
                    Week {secondaryEntry.weekNumber} • {secondaryEntry.weightKg} kg • {secondaryEntry.waistInches}"
                  </div>
                </div>
              </div>

              {/* Primary (Later / Current) */}
              <div className="flex flex-col items-center bg-gray-950/40 p-4 rounded-2xl border border-gray-800">
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                    Current / Progression
                  </span>
                  <select
                    value={primaryIndex}
                    onChange={(e) => setPrimaryIndex(Number(e.target.value))}
                    className="bg-gray-800 text-xs text-white px-2.5 py-1.5 rounded-lg border border-gray-700 focus:outline-none"
                  >
                    {entries.map((entry, idx) => (
                      <option key={entry.id} value={idx}>
                        Week {entry.weekNumber} ({entry.checkInDate}) - {entry.weightKg}kg
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full aspect-[3/4] max-h-[48vh] rounded-xl overflow-hidden bg-black/60 border border-gray-800 flex items-center justify-center relative shadow-inner">
                  {getPoseUrl(primaryEntry, selectedPose) ? (
                    <img
                      src={getPoseUrl(primaryEntry, selectedPose)}
                      alt={`Current Week ${primaryEntry.weekNumber}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-500 text-xs">No photo available</div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs px-2.5 py-0.5 rounded text-[11px] font-bold text-emerald-400">
                    Week {primaryEntry.weekNumber} • {primaryEntry.weightKg} kg • {primaryEntry.waistInches}"
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-950/80 border-t border-gray-800 text-center text-xs text-gray-500 shrink-0">
          Photos are encrypted and strictly accessible only by the account owner and Super Admin Chinmay.
        </div>
      </div>
    </div>
  );
}
