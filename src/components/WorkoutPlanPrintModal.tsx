import React, { useState } from 'react';
import {
  X,
  Printer,
  ExternalLink,
  Download,
  Dumbbell,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';
import { WorkoutPlan } from '../types';
import {
  generateWorkoutPlanPrintableHtml,
  openPrintableHtmlInNewTab,
  downloadPrintableHtml,
} from '../lib/printUtils';
import { formatISTDateTime } from '../lib/timestampUtils';
import { extractYouTubeVideoId, getYouTubeWatchUrl, getYouTubeThumbnailUrl } from '../lib/youtubeUtils';
import MedicalDisclaimer from './MedicalDisclaimer';

interface WorkoutPlanPrintModalProps {
  plan: WorkoutPlan;
  userName?: string;
  userEmail?: string;
  onClose: () => void;
}

export default function WorkoutPlanPrintModal({
  plan,
  userName = 'Member',
  userEmail = '',
  onClose,
}: WorkoutPlanPrintModalProps) {
  const [printError, setPrintError] = useState<string | null>(null);

  const currentDate = formatISTDateTime(plan.updatedAt || plan.createdAt || new Date().toISOString());

  const htmlContent = generateWorkoutPlanPrintableHtml(plan, userName, userEmail);

  const handlePrint = () => {
    setPrintError(null);
    try {
      window.print();
    } catch (err: unknown) {
      console.warn('Direct print blocked by iframe sandbox, falling back to new tab:', err);
      setPrintError('Direct print was blocked by the browser frame. Opening in a new tab instead...');
      openPrintableHtmlInNewTab(htmlContent, `${plan.name}_Workout_Routine`);
    }
  };

  const handleOpenTab = () => {
    const opened = openPrintableHtmlInNewTab(htmlContent, `${plan.name}_Workout_Routine`);
    if (!opened) {
      setPrintError('Browser blocked popup window. HTML file has been downloaded instead!');
    }
  };

  const handleDownload = () => {
    downloadPrintableHtml(htmlContent, `${plan.name}_Workout_Routine`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Modal Top Control Bar */}
        <div className="p-4 sm:p-5 bg-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Print & Export Workout Routine</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  PDF Ready
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Choose to print directly, open an unrestricted printable tab, or download HTML.
              </p>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              title="Trigger browser print"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleOpenTab}
              className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-gray-700"
              title="Opens pristine A4 page in a new tab where Save as PDF always works"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Tab</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-gray-700"
              title="Download standalone HTML file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice if iframe direct print had an issue */}
        {printError && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{printError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintError(null)}
              className="text-amber-800 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Printable Document Preview Pane */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100/80">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-md border border-gray-200 space-y-6 printable-document">
            
            {/* Header */}
            <div className="border-b-2 border-indigo-600 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Dumbbell className="w-5 h-5" />
                  </span>
                  <h1 className="text-2xl font-black text-indigo-950 tracking-tight">FITKODE</h1>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Structured Resistance Training & Hypertrophy Program</p>
                <div className="mt-3">
                  <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                  <p className="text-xs text-gray-600">
                    Difficulty: <strong className="text-gray-900">{plan.difficulty || 'Intermediate'}</strong>
                  </p>
                </div>
              </div>

              <div className="sm:text-right text-xs text-gray-600 space-y-1">
                <div>Member: <strong className="text-gray-900">{userName}</strong></div>
                {userEmail && <div className="text-[11px] text-gray-500">{userEmail}</div>}
                <div>Date: <strong className="text-gray-900">{currentDate}</strong></div>
                <div>Coach: <strong className="text-indigo-700">{plan.coachName || 'Chinmay Jain (INFS Certified)'}</strong></div>
                <div className="pt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-900">
                    {plan.createdBy === 'coach' ? (
                      <>
                        <ShieldCheck className="w-3 h-3 mr-1 text-purple-700" />
                        Coach Prescribed
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 mr-1 text-emerald-600" />
                        Member Routine
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Coach Directive Box */}
            {plan.coachNotes && (
              <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950">
                <strong className="block mb-1 text-purple-900 font-bold">Coach Directives:</strong>
                <p className="leading-relaxed">{plan.coachNotes}</p>
              </div>
            )}

            {/* Target Split Banner */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
              <div className="p-2 border-r border-indigo-200/60">
                <p className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Primary Goal</p>
                <p className="text-base font-black text-gray-900">{plan.goal || 'Hypertrophy'}</p>
              </div>
              <div className="p-2 border-r border-indigo-200/60">
                <p className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Frequency</p>
                <p className="text-base font-black text-indigo-700">{plan.daysPerWeek || (plan.days ? plan.days.length : 4)} Days / Wk</p>
              </div>
              <div className="p-2">
                <p className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Split Days</p>
                <p className="text-base font-black text-gray-900">{(plan.days || []).length} Scheduled</p>
              </div>
            </div>

            {/* Workout Days List */}
            <div className="space-y-4">
              {(plan.days || []).map((day, dIdx) => (
                <div key={day.id || dIdx} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        Day {dIdx + 1}
                      </span>
                      <strong className="text-xs font-bold text-gray-900">{day.dayName}</strong>
                      <span className="text-xs text-gray-500">&bull; {day.focus}</span>
                    </div>
                    <span className="text-[11px] font-bold bg-white text-indigo-900 border border-indigo-100 px-2 py-0.5 rounded-lg">
                      {(day.exercises || []).length} Exercises
                    </span>
                  </div>

                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 bg-white">
                        <th className="py-2 px-4">Exercise</th>
                        <th className="py-2 px-4">Target Muscle</th>
                        <th className="py-2 px-4 text-center">Sets</th>
                        <th className="py-2 px-4 text-center">Reps</th>
                        <th className="py-2 px-4 text-center">Rest</th>
                        <th className="py-2 px-4">Form Cues / Notes</th>
                        <th className="py-2 px-4 text-center">Video Demo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(day.exercises || []).map((ex, exIdx) => {
                        const videoId = extractYouTubeVideoId(ex.videoUrl);
                        const watchUrl = videoId ? getYouTubeWatchUrl(ex.videoUrl) : null;
                        const thumbUrl = videoId ? getYouTubeThumbnailUrl(ex.videoUrl, 'mqdefault') : null;

                        return (
                          <tr key={ex.id || exIdx} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-4 font-bold text-gray-900">{exIdx + 1}. {ex.name}</td>
                            <td className="py-2.5 px-4 text-gray-600">{ex.targetMuscle || '-'}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-indigo-700">{ex.sets || 3}</td>
                            <td className="py-2.5 px-4 text-center font-semibold text-gray-900">{ex.reps || '8-12'}</td>
                            <td className="py-2.5 px-4 text-center text-gray-500">{ex.restSeconds ? `${ex.restSeconds}s` : '90s'}</td>
                            <td className="py-2.5 px-4 text-gray-600 text-[11px]">{ex.notes || '-'}</td>
                            <td className="py-2 px-4 text-center">
                              {watchUrl && thumbUrl ? (
                                <a
                                  href={watchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex flex-col items-center gap-1 group/thumb hover:opacity-90 transition-opacity"
                                  title={`Watch ${ex.name} reference demo on YouTube`}
                                >
                                  <div className="relative w-16 h-9 rounded-md overflow-hidden bg-black border border-gray-200 shadow-2xs">
                                    <img
                                      src={thumbUrl}
                                      alt={ex.name}
                                      className="w-full h-full object-cover"
                                      crossOrigin="anonymous"
                                    />
                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover/thumb:bg-black/10 transition-colors">
                                      <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] font-bold">
                                        ▶
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-bold text-red-600 group-hover/thumb:underline">
                                    Watch Link →
                                  </span>
                                </a>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {(!day.exercises || day.exercises.length === 0) && (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-gray-400 italic">
                            No exercises scheduled for this day.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Directives */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
              <strong className="font-bold text-indigo-900">Training Execution Directives:</strong>
              <ul className="list-disc list-inside space-y-1 text-indigo-900/90 leading-relaxed text-[11px]">
                <li>Always warm up shoulders, hips, and core with 5 minutes of mobility before heavy sets.</li>
                <li>Control the eccentric (downward) phase of each repetition for 2-3 seconds.</li>
                <li>Keep 1 to 2 reps in reserve (RIR) on heavy compound movements to prevent technical breakdown.</li>
                <li>Log weights lifted progressively each week to stimulate progressive overload.</li>
              </ul>
            </div>

            {/* Non-Clinical & Coaching Disclaimer */}
            <MedicalDisclaimer variant="compact" />

            {/* Document Footer */}
            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between text-[10px] text-gray-400 gap-2">
              <div>Fitkode Coaching &bull; fitkode.com &bull; Designed by Coach Chinmay Jain</div>
              <div>Strict Confidentiality Guaranteed &bull; Document ID: {plan.id}</div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
