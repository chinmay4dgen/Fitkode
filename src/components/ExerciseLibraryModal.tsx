import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  Plus,
  Play,
  Check,
  ShieldCheck,
  User,
  Trash2,
  Youtube,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { ExerciseItem } from '../types';
import {
  getAllExercisesForUser,
  saveMasterExercise,
  saveUserCustomExercise,
  deleteUserCustomExercise,
  deleteMasterExercise,
  updateMasterExerciseVideoUrl,
  subscribeToExerciseStoreUpdates,
} from '../lib/exerciseStore';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
} from '../lib/youtubeUtils';
import ExerciseVideoLinkModal from './ExerciseVideoLinkModal';

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  dayId?: string | null;
  dayName?: string;
  userEmail: string;
  isCoachMode?: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseItem) => void;
  onOpenVideoPreview: (videoUrl: string, exerciseName: string, targetMuscle?: string, notes?: string) => void;
}

const MUSCLE_GROUPS = [
  'All Muscle Groups',
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Biceps',
  'Triceps',
  'Core',
  'Cardio',
];

export default function ExerciseLibraryModal({
  isOpen,
  dayId,
  dayName,
  userEmail,
  isCoachMode = false,
  onClose,
  onSelectExercise,
  onOpenVideoPreview,
}: ExerciseLibraryModalProps) {
  // Store data
  const [storeData, setStoreData] = useState(() => getAllExercisesForUser(userEmail));

  const refreshStore = () => {
    setStoreData(getAllExercisesForUser(userEmail));
  };

  useEffect(() => {
    refreshStore();
    const unsub = subscribeToExerciseStoreUpdates(refreshStore);
    return unsub;
  }, [userEmail]);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All Muscle Groups');
  const [activeTab, setActiveTab] = useState<'all' | 'master' | 'custom'>('all');

  // Form for creating new exercise
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('Chest');
  const [newSets, setNewSets] = useState(3);
  const [newReps, setNewReps] = useState('8-12');
  const [newRest, setNewRest] = useState(90);
  const [newNotes, setNewNotes] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [editingMasterVideoExercise, setEditingMasterVideoExercise] = useState<ExerciseItem | null>(null);

  // Video preview for the new exercise form
  const newVideoId = extractYouTubeVideoId(newVideoUrl);
  const newThumbnail = newVideoId ? getYouTubeThumbnailUrl(newVideoUrl, 'hqdefault') : null;

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    let list = storeData.all;
    if (activeTab === 'master') {
      list = storeData.master;
    } else if (activeTab === 'custom') {
      list = storeData.custom;
    }

    return list.filter((ex) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.targetMuscle.toLowerCase().includes(q) ||
        (ex.notes && ex.notes.toLowerCase().includes(q));

      const matchMuscle =
        muscleFilter === 'All Muscle Groups' ||
        ex.targetMuscle.toLowerCase() === muscleFilter.toLowerCase();

      return matchSearch && matchMuscle;
    });
  }, [storeData, activeTab, searchQuery, muscleFilter]);

  if (!isOpen) return null;

  const handleCreateExercise = (andAddToRoutine = false) => {
    setFormError(null);
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setFormError('Please enter an exercise name.');
      return;
    }

    const itemPayload = {
      name: trimmedName,
      targetMuscle: newMuscle,
      sets: Number(newSets) || 3,
      reps: newReps.trim() || '8-12',
      restSeconds: Number(newRest) || 90,
      notes: newNotes.trim() || undefined,
      videoUrl: newVideoUrl.trim() || undefined,
    };

    let createdItem: ExerciseItem;

    if (isCoachMode) {
      // Coach adds to Master Library!
      const updatedList = saveMasterExercise(itemPayload);
      createdItem = updatedList[0] || { ...itemPayload, id: `ex_${Date.now()}` };
      setSuccessToast(`"${trimmedName}" saved to Master Exercise Library!`);
    } else {
      // Member adds to their own private profile!
      const updatedList = saveUserCustomExercise(userEmail, itemPayload);
      createdItem = updatedList[0] || { ...itemPayload, id: `ex_${Date.now()}` };
      setSuccessToast(`"${trimmedName}" saved to your Custom Exercises!`);
    }

    refreshStore();

    // Reset form
    setNewName('');
    setNewNotes('');
    setNewVideoUrl('');
    setFormError(null);
    setIsCreatingNew(false);

    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);

    if (andAddToRoutine) {
      onSelectExercise(createdItem);
      onClose();
    }
  };

  const handleDeleteExercise = (e: React.MouseEvent, ex: ExerciseItem) => {
    e.stopPropagation();
    if (!window.confirm(`Remove "${ex.name}" from your saved exercises?`)) return;

    if (ex.isCustom) {
      deleteUserCustomExercise(userEmail, ex.id);
    } else if (isCoachMode) {
      deleteMasterExercise(ex.id);
    }
    refreshStore();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Exercise & Movement Library</h3>
                {isCoachMode ? (
                  <span className="text-[10px] font-bold uppercase bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-300" />
                    Coach Master Mode
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700 flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-400" />
                    Member Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {dayName
                  ? `Selecting movement for: ${dayName}`
                  : 'Browse verified movements, watch YouTube form demos, and manage exercises.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isCreatingNew && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Movement</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-150">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {successToast}
            </span>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-white/80 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* New Exercise Form Mode */}
        {isCreatingNew ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">
                  {isCoachMode ? 'Create New Master Library Exercise' : 'Create Custom Exercise'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setFormError(null);
                }}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 underline cursor-pointer"
              >
                Back to Library
              </button>
            </div>

            {/* Storage Target Banner */}
            <div
              className={`p-3.5 rounded-2xl text-xs border flex items-start space-x-2.5 ${
                isCoachMode
                  ? 'bg-purple-50 border-purple-200 text-purple-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              {isCoachMode ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-900 block font-bold">Coach Master Database Mode:</strong>
                    <span>
                      Because you are logged in as Coach, this exercise will be permanently saved to the{' '}
                      <strong>Master Exercise Library</strong> and will be available for all members to search and select.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 block font-bold">Personal Custom Exercise:</strong>
                    <span>
                      This exercise will be saved only to your private account ({userEmail}) and will not modify the master library.
                    </span>
                  </div>
                </>
              )}
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Exercise Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Romanian Deadlift, Incline Dumbbell Press, Bulgarians..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Muscle Group</label>
                <select
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Quads">Quads</option>
                  <option value="Hamstrings">Hamstrings</option>
                  <option value="Glutes">Glutes</option>
                  <option value="Calves">Calves</option>
                  <option value="Biceps">Biceps</option>
                  <option value="Triceps">Triceps</option>
                  <option value="Core">Core</option>
                  <option value="Cardio">Cardio & Conditioning</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Sets</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSets}
                    onChange={(e) => setNewSets(Number(e.target.value) || 1)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-center text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Reps</label>
                  <input
                    type="text"
                    value={newReps}
                    placeholder="8-12"
                    onChange={(e) => setNewReps(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-center text-indigo-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Rest (s)</label>
                  <input
                    type="number"
                    step="15"
                    value={newRest}
                    onChange={(e) => setNewRest(Number(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-center text-gray-700 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Form Cues / Technique Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Hinge at hips, keep bar close to shins, brace core, 2s pause at bottom"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 outline-none"
                />
              </div>

              {/* YouTube Reference Link & Thumbnail Preview */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span>YouTube Video Reference Link (Optional)</span>
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:ring-2 focus:ring-red-500 outline-none"
                />

                {/* Live Thumbnail Verification */}
                {newThumbnail && (
                  <div className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center gap-3.5 shadow-2xs animate-in fade-in duration-150">
                    <div className="relative w-28 h-16 rounded-xl overflow-hidden bg-black shrink-0 shadow-sm">
                      <img
                        src={newThumbnail}
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ▶
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Live YouTube Reference Thumbnail Loaded</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        This reference video and thumbnail will be visible in the routine and saved to PDF exports.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenVideoPreview(
                            newVideoUrl,
                            newName || 'Exercise Reference Video',
                            newMuscle,
                            newNotes
                          )
                        }
                        className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Test Video Playback</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="py-2.5 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCreateExercise(false)}
                  className="py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
                >
                  Save to Library
                </button>
                {dayId && (
                  <button
                    type="button"
                    onClick={() => handleCreateExercise(true)}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save & Add to Day</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search & Tabs Controls */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3 shrink-0">
              {/* Tabs: All / Master / Custom */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    All ({storeData.all.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('master')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === 'master'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Master Library ({storeData.master.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === 'custom'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Custom ({storeData.custom.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Custom Movement</span>
                </button>
              </div>

              {/* Search & Muscle Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search exercise, muscle (squat, bench, pull-up, curls, lateral)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-300 text-xs text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={muscleFilter}
                  onChange={(e) => setMuscleFilter(e.target.value)}
                  className="py-2 px-3 bg-white rounded-xl border border-gray-300 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 bg-gray-50/50">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300 p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">No Movements Found</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {searchQuery
                      ? `No exercises matched "${searchQuery}". You can create this exercise now!`
                      : 'No exercises in this category.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery) setNewName(searchQuery);
                      setIsCreatingNew(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create "{searchQuery || 'New Movement'}"</span>
                  </button>
                </div>
              ) : (
                filteredExercises.map((ex) => {
                  const videoId = extractYouTubeVideoId(ex.videoUrl);
                  const thumb = videoId ? getYouTubeThumbnailUrl(ex.videoUrl, 'mqdefault') : null;

                  return (
                    <div
                      key={ex.id}
                      className="p-3 sm:p-4 rounded-2xl bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-start space-x-3 min-w-0">
                        {/* Video Thumbnail Button */}
                        {thumb && ex.videoUrl ? (
                          <div
                            onClick={() =>
                              onOpenVideoPreview(ex.videoUrl!, ex.name, ex.targetMuscle, ex.notes)
                            }
                            className="relative w-20 h-13 rounded-xl overflow-hidden bg-black shrink-0 border border-gray-200 cursor-pointer group/thumb shadow-2xs hover:opacity-90 transition-all"
                            title="Click to preview YouTube video demonstration"
                          >
                            <img
                              src={thumb}
                              alt={ex.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover/thumb:bg-black/10 transition-colors">
                              <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] font-bold">
                                ▶
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-13 rounded-xl bg-gray-100 border border-dashed border-gray-300 shrink-0 flex flex-col items-center justify-center text-gray-400">
                            <Youtube className="w-4 h-4 opacity-40" />
                            <span className="text-[9px] mt-0.5">No video</span>
                          </div>
                        )}

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-bold text-sm text-gray-900 group-hover:text-indigo-950">
                              {ex.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                              {ex.targetMuscle}
                            </span>
                            {ex.isCustom ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                My Custom
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700">
                                Master
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-600">
                            Default: <strong className="text-gray-900">{ex.sets} sets</strong> ×{' '}
                            <strong className="text-indigo-700">{ex.reps} reps</strong> •{' '}
                            <span className="text-gray-500">{ex.restSeconds || 90}s rest</span>
                          </p>

                          {ex.notes && (
                            <p className="text-[11px] text-gray-500 italic line-clamp-1">
                              Cue: {ex.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        {ex.videoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenVideoPreview(ex.videoUrl!, ex.name, ex.targetMuscle, ex.notes)
                            }
                            className="py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                            title="Watch reference video"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span className="hidden md:inline">Watch Form</span>
                          </button>
                        )}

                        {/* Super Admin: Quick Update or Remove Video URL from Master Database */}
                        {isCoachMode && !ex.isCustom && (
                          <button
                            type="button"
                            onClick={() => setEditingMasterVideoExercise(ex)}
                            className="py-1.5 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                            title="Super Admin: Update or Delete YouTube reference URL in Master Database"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="hidden md:inline">{ex.videoUrl ? 'Edit URL' : '+ Video'}</span>
                          </button>
                        )}

                        {/* Delete button if user's custom movement or coach in master */}
                        {(ex.isCustom || (isCoachMode && !ex.id.startsWith('master_builtin_'))) && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteExercise(e, ex)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete this exercise"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectExercise(ex);
                            onClose();
                          }}
                          className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{dayId ? 'Add to Day' : 'Add to Routine'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Total movements available: {storeData.all.length}</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>

      {/* Super Admin Master Exercise Video URL Editor Modal */}
      {isCoachMode && editingMasterVideoExercise && (
        <ExerciseVideoLinkModal
          isOpen={Boolean(editingMasterVideoExercise)}
          exercise={editingMasterVideoExercise}
          dayName="Master Exercise Database"
          isSuperAdmin={true}
          clientName="Master Exercise Database"
          onClose={() => setEditingMasterVideoExercise(null)}
          onSaveLink={(_id, videoUrl) => {
            updateMasterExerciseVideoUrl(editingMasterVideoExercise.name, videoUrl);
            setEditingMasterVideoExercise(null);
            setSuccessToast(
              videoUrl
                ? `Updated YouTube reference URL for "${editingMasterVideoExercise.name}" in Master Database!`
                : `Removed YouTube reference URL for "${editingMasterVideoExercise.name}" from Master Database.`
            );
            setTimeout(() => setSuccessToast(null), 4000);
          }}
          onOpenPreview={(url, name) => {
            onOpenVideoPreview(url, name, editingMasterVideoExercise.targetMuscle, editingMasterVideoExercise.notes);
          }}
        />
      )}
    </div>
  );
}
