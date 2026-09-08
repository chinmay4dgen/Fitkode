import React from 'react';
import { X, ExternalLink, Youtube, Play } from 'lucide-react';
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
} from '../lib/youtubeUtils';

interface YouTubeVideoModalProps {
  videoUrl?: string | null;
  exerciseName?: string;
  targetMuscle?: string;
  notes?: string;
  onClose: () => void;
}

export default function YouTubeVideoModal({
  videoUrl,
  exerciseName = 'Exercise Reference Demo',
  targetMuscle,
  notes,
  onClose,
}: YouTubeVideoModalProps) {
  const videoId = extractYouTubeVideoId(videoUrl);
  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const watchUrl = getYouTubeWatchUrl(videoUrl);

  if (!videoUrl || !videoId || !embedUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-gray-950 text-white rounded-3xl max-w-3xl w-full flex flex-col shadow-2xl border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">{exerciseName}</h3>
                {targetMuscle && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-900/60 text-purple-300 border border-purple-800">
                    {targetMuscle}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">Official Form Guide & Biomechanical Demonstration</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {watchUrl && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center space-x-1 shadow-sm"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
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

        {/* Video Player 16:9 */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`${embedUrl}&autoplay=1`}
            title={`${exerciseName} YouTube Video`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Footer info & Form notes */}
        <div className="p-4 bg-gray-900/90 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-gray-300">
            {notes ? (
              <p className="line-clamp-2">
                <strong className="text-gray-100">Coach Form Cue:</strong> {notes}
              </p>
            ) : (
              <p className="text-gray-400">Pay close attention to movement trajectory, joint alignment, and control.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-auto py-1.5 px-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold cursor-pointer"
          >
            Close Player
          </button>
        </div>
      </div>
    </div>
  );
}
