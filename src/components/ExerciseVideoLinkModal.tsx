import React, { useState, useEffect } from 'react';
import {
  X,
  Youtube,
  ExternalLink,
  Check,
  AlertCircle,
  Play,
  Trash2,
  Database,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';
import { ExerciseItem } from '../types';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
  isValidYouTubeUrl,
} from '../lib/youtubeUtils';

interface ExerciseVideoLinkModalProps {
  isOpen: boolean;
  exercise: ExerciseItem | null;
  dayName?: string;
  isSuperAdmin?: boolean;
  clientName?: string;
  onClose: () => void;
  onSaveLink: (exerciseId: string, videoUrl: string | undefined, updateMasterDatabase?: boolean) => void;
  onOpenPreview?: (videoUrl: string, exerciseName: string) => void;
}

export default function ExerciseVideoLinkModal({
  isOpen,
  exercise,
  dayName,
  isSuperAdmin = false,
  clientName,
  onClose,
  onSaveLink,
  onOpenPreview,
}: ExerciseVideoLinkModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [updateScope, setUpdateScope] = useState<'client_only' | 'master_database'>('client_only');

  useEffect(() => {
    if (exercise) {
      setUrlInput(exercise.videoUrl || '');
      setErrorNotice(null);
      // Default to client_only unless coach specifically wants to push to Master DB
      setUpdateScope('client_only');
    }
  }, [exercise, isOpen]);

  if (!isOpen || !exercise) return null;

  const videoId = extractYouTubeVideoId(urlInput);
  const isValid = Boolean(videoId);
  const thumbnailUrl = videoId ? getYouTubeThumbnailUrl(urlInput, 'hqdefault') : null;
  const watchUrl = videoId ? getYouTubeWatchUrl(urlInput) : null;

  const handleSave = () => {
    const trimmed = urlInput.trim();
    const shouldUpdateMaster = Boolean(isSuperAdmin && updateScope === 'master_database');

    if (!trimmed) {
      onSaveLink(exercise.id, undefined, shouldUpdateMaster);
      onClose();
      return;
    }

    if (!isValid) {
      setErrorNotice('Please provide a valid YouTube link (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }

    onSaveLink(exercise.id, trimmed, shouldUpdateMaster);
    onClose();
  };

  const handleClear = () => {
    const shouldUpdateMaster = Boolean(isSuperAdmin && updateScope === 'master_database');
    setUrlInput('');
    onSaveLink(exercise.id, undefined, shouldUpdateMaster);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center font-bold">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">YouTube Reference Video</h3>
              <p className="text-xs text-red-100">
                {exercise.name} {dayName ? `• ${dayName}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Super Admin Scope Selector */}
          {isSuperAdmin && (
            <div className="p-3.5 bg-purple-50/90 border border-purple-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Super Admin Target Scope</span>
                </span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-800">
                  Coach Chinmay
                </span>
              </div>

              <p className="text-[11px] text-purple-900 leading-snug">
                Where should this updated YouTube link be applied?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <label
                  onClick={() => setUpdateScope('client_only')}
                  className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                    updateScope === 'client_only'
                      ? 'bg-white border-purple-600 shadow-xs ring-2 ring-purple-600/20'
                      : 'bg-white/60 border-purple-200 hover:bg-white text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="updateScope"
                    value="client_only"
                    checked={updateScope === 'client_only'}
                    onChange={() => setUpdateScope('client_only')}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900 flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-600" />
                      <span>Client Profile Only</span>
                    </span>
                    <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">
                      Apply exclusively to {clientName ? `${clientName}'s` : "this client's"} current routine. Master DB untouched.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setUpdateScope('master_database')}
                  className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                    updateScope === 'master_database'
                      ? 'bg-white border-purple-600 shadow-xs ring-2 ring-purple-600/20'
                      : 'bg-white/60 border-purple-200 hover:bg-white text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="updateScope"
                    value="master_database"
                    checked={updateScope === 'master_database'}
                    onChange={() => setUpdateScope('master_database')}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-purple-950 flex items-center gap-1">
                      <Database className="w-3 h-3 text-purple-700" />
                      <span>Master Database + Client</span>
                    </span>
                    <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">
                      Replaces expired/broken link globally across Master Library and all future workout plans.
                    </span>
                  </div>
                </label>
              </div>

              {updateScope === 'master_database' && (
                <div className="p-2 rounded-xl bg-purple-100/70 border border-purple-200 text-[11px] text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span>
                    Will update <strong>"{exercise.name}"</strong> in the Master Exercise Database.
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              YouTube Video Link or URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setErrorNotice(null);
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all font-mono"
                autoFocus
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    setErrorNotice(null);
                  }}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Supports standard YouTube URLs, short URLs (youtu.be), shorts, and mobile links.
            </p>
          </div>

          {errorNotice && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Live Thumbnail Preview */}
          {isValid && thumbnailUrl ? (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Valid YouTube Video Detected</span>
                </span>
                <span className="text-[11px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                  ID: {videoId}
                </span>
              </div>

              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-gray-300 group">
                <img
                  src={thumbnailUrl}
                  alt="YouTube Video Thumbnail Preview"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-all">
                  <button
                    type="button"
                    onClick={() => onOpenPreview && onOpenPreview(urlInput, exercise.name)}
                    className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
                    title="Preview Demo Video"
                  >
                    <Play className="w-6 h-6 ml-0.5 fill-current" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>This thumbnail and link will also appear in the printable/PDF export.</span>
                {watchUrl && (
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Test on YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ) : urlInput.trim() ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Could not recognize a YouTube video ID in this URL. Check format.</span>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center space-y-1 text-xs text-gray-500">
              <Youtube className="w-6 h-6 text-gray-400 mx-auto" />
              <p className="font-semibold text-gray-700">No YouTube Reference Video</p>
              <p className="text-[11px] text-gray-400">
                Adding a video link allows members to watch proper biomechanical form directly in the routine and PDF.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            {exercise.videoUrl && (
              <button
                type="button"
                onClick={handleClear}
                className="py-2 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isSuperAdmin && updateScope === 'master_database'
                    ? 'Remove from Master DB & Routine'
                    : 'Remove Video'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {isSuperAdmin && updateScope === 'master_database'
                  ? 'Save to Master DB + Routine'
                  : 'Save Link'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
