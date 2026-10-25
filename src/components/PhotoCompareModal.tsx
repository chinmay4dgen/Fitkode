import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  ArrowRightLeft,
  Camera,
  Download,
  TrendingDown,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { WeeklyTrackerEntry } from '../types';

interface PhotoCompareModalProps {
  entries: WeeklyTrackerEntry[];
  initialEntryId?: string;
  initialCompareMode?: boolean;
  memberName?: string;
  onClose: () => void;
}

export default function PhotoCompareModal({
  entries,
  initialEntryId,
  initialCompareMode = false,
  memberName = 'Fitkode Member',
  onClose,
}: PhotoCompareModalProps) {
  const [selectedPose, setSelectedPose] = useState<'front' | 'left' | 'right' | 'back'>('front');
  const [compareMode, setCompareMode] = useState<boolean>(
    initialCompareMode || entries.length > 1
  );
  const [downloadingCard, setDownloadingCard] = useState<boolean>(false);
  const [cardDownloaded, setCardDownloaded] = useState<boolean>(false);

  // Base entry (e.g. current or latest)
  const initialIdx = entries.findIndex((e) => e.id === initialEntryId);
  const [primaryIndex, setPrimaryIndex] = useState(initialIdx >= 0 ? initialIdx : 0);
  // Comparison entry (default to oldest / baseline Week 1 entry if available)
  const [secondaryIndex, setSecondaryIndex] = useState(
    entries.length > 1 ? entries.length - 1 : 0
  );

  const primaryEntry = entries[primaryIndex] || entries[0];
  const secondaryEntry = entries[secondaryIndex] || entries[entries.length - 1];

  const getPoseUrl = (entry: WeeklyTrackerEntry, pose: 'front' | 'left' | 'right' | 'back') => {
    if (!entry) return '';
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

  // Compute deltas between secondaryEntry (Before/Baseline) and primaryEntry (After/Latest)
  const weightDelta =
    primaryEntry && secondaryEntry
      ? Number((primaryEntry.weightKg - secondaryEntry.weightKg).toFixed(1))
      : 0;
  const waistDelta =
    primaryEntry && secondaryEntry
      ? Number((primaryEntry.waistInches - secondaryEntry.waistInches).toFixed(1))
      : 0;
  const hipsDelta =
    primaryEntry && secondaryEntry && primaryEntry.hipsInches && secondaryEntry.hipsInches
      ? Number((primaryEntry.hipsInches - secondaryEntry.hipsInches).toFixed(1))
      : 0;
  const weeksSpan =
    primaryEntry && secondaryEntry
      ? Math.max(1, Math.abs((primaryEntry.weekNumber || 1) - (secondaryEntry.weekNumber || 1)))
      : 1;

  // Helper to load an image safely for Canvas rendering
  const loadImageForCanvas = (url?: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Generate a 1080x1350 Fitkode Branded Transformation Card PNG
  const handleDownloadTransformationCard = async () => {
    if (!primaryEntry || !secondaryEntry) return;
    setDownloadingCard(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
      bgGrad.addColorStop(0, '#042f2e');
      bgGrad.addColorStop(0.5, '#064e3b');
      bgGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Subtle top accent bar
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, 1080, 14);

      // 2. Header Branding
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText('FITKODE TRANSFORMATION STUDIO', 60, 75);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px Inter, system-ui, sans-serif';
      ctx.fillText(`${memberName} • ${weeksSpan}-Week Progress`, 60, 135);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '500 22px Inter, system-ui, sans-serif';
      ctx.fillText(
        `Week ${secondaryEntry.weekNumber} (${secondaryEntry.checkInDate})  →  Week ${primaryEntry.weekNumber} (${primaryEntry.checkInDate}) • ${poseLabels[selectedPose]}`,
        60,
        175
      );

      // 3. Load Before & After Photos
      const beforeUrl = getPoseUrl(secondaryEntry, selectedPose);
      const afterUrl = getPoseUrl(primaryEntry, selectedPose);
      const [beforeImg, afterImg] = await Promise.all([
        loadImageForCanvas(beforeUrl),
        loadImageForCanvas(afterUrl),
      ]);

      const drawPhotoFrame = (
        img: HTMLImageElement | null,
        entry: WeeklyTrackerEntry,
        x: number,
        y: number,
        w: number,
        h: number,
        badgeText: string,
        badgeColor: string
      ) => {
        // Card frame
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 28);
        ctx.fill();
        ctx.stroke();

        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 24);
          ctx.clip();
          const scale = Math.min((w - 8) / img.width, (h - 8) / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          const dx = x + 4 + (w - 8 - dw) / 2;
          const dy = y + 4 + (h - 8 - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();
        } else {
          // Sleek silhouette metric placeholder when photo isn't uploaded
          ctx.fillStyle = '#1f2937';
          ctx.beginPath();
          ctx.roundRect(x + 24, y + 90, w - 48, h - 180, 20);
          ctx.fill();

          ctx.fillStyle = '#9ca3af';
          ctx.font = 'bold 24px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`WEEK ${entry.weekNumber} CHECK-IN`, x + w / 2, y + h / 2 - 60);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 58px Inter, system-ui, sans-serif';
          ctx.fillText(`${entry.weightKg} kg`, x + w / 2, y + h / 2 + 15);

          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 30px Inter, system-ui, sans-serif';
          ctx.fillText(`Waist: ${entry.waistInches}"`, x + w / 2, y + h / 2 + 70);
          ctx.textAlign = 'left';
        }

        // Top Badge
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.beginPath();
        ctx.roundRect(x + 20, y + 20, 240, 48, 14);
        ctx.fill();

        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 22px Inter, system-ui, sans-serif';
        ctx.fillText(badgeText, x + 38, y + 52);

        // Bottom Stat Overlay Pill
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.beginPath();
        ctx.roundRect(x + 20, y + h - 76, w - 40, 56, 14);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 23px Inter, system-ui, sans-serif';
        ctx.fillText(
          `Wk ${entry.weekNumber}: ${entry.weightKg} kg  •  Waist ${entry.waistInches}"`,
          x + 38,
          y + h - 40
        );
      };

      // Draw Left (Before) & Right (After) frames
      drawPhotoFrame(
        beforeImg,
        secondaryEntry,
        60,
        215,
        465,
        680,
        `BEFORE • WEEK ${secondaryEntry.weekNumber}`,
        '#fbbf24'
      );
      drawPhotoFrame(
        afterImg,
        primaryEntry,
        555,
        215,
        465,
        680,
        `NOW • WEEK ${primaryEntry.weekNumber}`,
        '#34d399'
      );

      // 4. Bottom Transformation Delta Summary Box
      ctx.fillStyle = 'rgba(17, 24, 39, 0.92)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(60, 935, 960, 275, 28);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText('VERIFIED BIOMETRIC DELTAS', 100, 985);

      const drawStatCol = (
        label: string,
        val: string,
        sub: string,
        colX: number,
        accent: string
      ) => {
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 20px Inter, system-ui, sans-serif';
        ctx.fillText(label, colX, 1035);

        ctx.fillStyle = accent;
        ctx.font = '900 48px Inter, system-ui, sans-serif';
        ctx.fillText(val, colX, 1095);

        ctx.fillStyle = '#d1d5db';
        ctx.font = '500 20px Inter, system-ui, sans-serif';
        ctx.fillText(sub, colX, 1135);
      };

      const weightSign = weightDelta > 0 ? `+${weightDelta}` : `${weightDelta}`;
      const waistSign = waistDelta > 0 ? `+${waistDelta}` : `${waistDelta}`;

      drawStatCol(
        'BODY WEIGHT',
        `${weightSign} kg`,
        `${secondaryEntry.weightKg}kg → ${primaryEntry.weightKg}kg`,
        100,
        weightDelta <= 0 ? '#34d399' : '#fbbf24'
      );

      drawStatCol(
        'WAIST INCHES',
        `${waistSign}"`,
        `${secondaryEntry.waistInches}" → ${primaryEntry.waistInches}"`,
        420,
        waistDelta <= 0 ? '#34d399' : '#fbbf24'
      );

      drawStatCol(
        'DAILY ACTIVITY',
        `${(primaryEntry.avgStepsPerDay || 8000).toLocaleString()}`,
        `Avg steps/day • ${(primaryEntry.resistanceWorkoutDays || 0) + (primaryEntry.hiitCardioDays || 0)} workouts/wk`,
        710,
        '#60a5fa'
      );

      // 5. Footer
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText(
        'FITKODE PERFORMANCE & NUTRITION  •  COACHED BY CHINMAY JAIN',
        60,
        1285
      );

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `fitkode_transformation_wk${secondaryEntry.weekNumber}_to_wk${primaryEntry.weekNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCardDownloaded(true);
      setTimeout(() => setCardDownloaded(false), 3500);
    } catch (err) {
      console.error('Failed to generate transformation card:', err);
    } finally {
      setDownloadingCard(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 text-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-800 bg-gray-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Week 1 vs. Now Transformation Studio</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {memberName}
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Side-by-side visual body composition logs & shareable transformation card
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTransformationCard}
              disabled={downloadingCard}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Download high-resolution Fitkode Transformation Card for WhatsApp or Instagram"
            >
              {cardDownloaded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Card Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingCard ? 'Rendering PNG...' : 'Download Share Card (PNG)'}</span>
                </>
              )}
            </button>

            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  compareMode
                    ? 'bg-brand-green text-white shadow-xs'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{compareMode ? 'Single Week View' : 'Side-by-Side Compare'}</span>
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-start space-y-4">
          {/* Auto-Calculated Biometric Delta Banner when comparing */}
          {compareMode && primaryEntry && secondaryEntry && (
            <div className="bg-gradient-to-r from-emerald-950/90 via-gray-900 to-teal-950/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Weight Delta ({weeksSpan} Wks)
                </span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span
                    className={`text-base sm:text-lg font-black ${
                      weightDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ({secondaryEntry.weightKg} → {primaryEntry.weightKg}kg)
                  </span>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Waist Reduction
                </span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span
                    className={`text-base sm:text-lg font-black ${
                      waistDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {waistDelta > 0 ? `+${waistDelta}` : waistDelta}&quot;
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ({secondaryEntry.waistInches}&quot; → {primaryEntry.waistInches}&quot;)
                  </span>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Hips Circumference
                </span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-base sm:text-lg font-black text-sky-400">
                    {hipsDelta > 0 ? `+${hipsDelta}` : hipsDelta}&quot;
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ({secondaryEntry.hipsInches || '-'}&quot; → {primaryEntry.hipsInches || '-'}&quot;)
                  </span>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Latest Activity Consistency
                </span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-base sm:text-lg font-black text-purple-300">
                    {(primaryEntry.avgStepsPerDay || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    steps/d • {(primaryEntry.resistanceWorkoutDays || 0) + (primaryEntry.hiitCardioDays || 0)}x wkout
                  </span>
                </div>
              </div>
            </div>
          )}

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
                    {primaryEntry
                      ? new Date(primaryEntry.checkInDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    Weight: <strong className="text-white">{primaryEntry?.weightKg} kg</strong> | Waist:{' '}
                    <strong className="text-white">{primaryEntry?.waistInches}&quot;</strong>
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
              <div className="w-full aspect-[3/4] max-h-[52vh] rounded-2xl overflow-hidden bg-black/50 border border-gray-800 flex items-center justify-center relative shadow-inner">
                {getPoseUrl(primaryEntry, selectedPose) ? (
                  <img
                    src={getPoseUrl(primaryEntry, selectedPose)}
                    alt={`${poseLabels[selectedPose]} - Week ${primaryEntry.weekNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-gray-400 max-w-sm">
                    <div className="w-12 h-12 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center justify-center mx-auto mb-3 text-gray-500">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-300">
                      No Photo Uploaded for {poseLabels[selectedPose]}
                    </p>
                    <p className="text-xs mt-1.5 text-gray-500 leading-relaxed">
                      You can still download a branded metric transformation card above, or use &quot;Edit&quot; in the Weekly Tracker to attach front, side, or back photos.
                    </p>
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
                    Baseline / Earlier
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

                <div className="w-full aspect-[3/4] max-h-[44vh] rounded-xl overflow-hidden bg-black/60 border border-gray-800 flex items-center justify-center relative shadow-inner">
                  {getPoseUrl(secondaryEntry, selectedPose) ? (
                    <img
                      src={getPoseUrl(secondaryEntry, selectedPose)}
                      alt={`Reference Week ${secondaryEntry.weekNumber}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-400 space-y-1">
                      <Camera className="w-6 h-6 mx-auto text-gray-600 mb-1" />
                      <p className="text-xs font-bold text-gray-300">Week {secondaryEntry.weekNumber} Metrics</p>
                      <p className="text-lg font-black text-white">{secondaryEntry.weightKg} kg</p>
                      <p className="text-xs text-amber-400">Waist: {secondaryEntry.waistInches}&quot;</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-400 border border-white/10">
                    Week {secondaryEntry.weekNumber} • {secondaryEntry.weightKg} kg • {secondaryEntry.waistInches}&quot;
                  </div>
                </div>
              </div>

              {/* Primary (Later / Current) */}
              <div className="flex flex-col items-center bg-gray-950/40 p-4 rounded-2xl border border-gray-800">
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                    Latest / Progression
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

                <div className="w-full aspect-[3/4] max-h-[44vh] rounded-xl overflow-hidden bg-black/60 border border-gray-800 flex items-center justify-center relative shadow-inner">
                  {getPoseUrl(primaryEntry, selectedPose) ? (
                    <img
                      src={getPoseUrl(primaryEntry, selectedPose)}
                      alt={`Current Week ${primaryEntry.weekNumber}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-400 space-y-1">
                      <Camera className="w-6 h-6 mx-auto text-gray-600 mb-1" />
                      <p className="text-xs font-bold text-gray-300">Week {primaryEntry.weekNumber} Metrics</p>
                      <p className="text-lg font-black text-white">{primaryEntry.weightKg} kg</p>
                      <p className="text-xs text-emerald-400">Waist: {primaryEntry.waistInches}&quot;</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400 border border-white/10">
                    Week {primaryEntry.weekNumber} • {primaryEntry.weightKg} kg • {primaryEntry.waistInches}&quot;
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

