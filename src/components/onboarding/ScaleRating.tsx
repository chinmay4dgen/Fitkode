import React from 'react';

interface ScaleRatingProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  lowLabel?: string;
  highLabel?: string;
  required?: boolean;
  helpText?: string;
}

export const ScaleRating: React.FC<ScaleRatingProps> = ({
  label,
  value,
  onChange,
  lowLabel = '1 (Not willing / Low)',
  highLabel = '5 (Very willing / High)',
  required = true,
  helpText,
}) => {
  return (
    <div className="bg-natural-oat/50 p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 transition-all hover:border-brand-green/40">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-2.5">
        <div>
          <label className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {helpText && (
            <p className="text-[11px] text-gray-500 mt-0.5">{helpText}</p>
          )}
        </div>
        <span className="text-xs font-bold text-brand-green bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 self-start">
          Rating: {value || 1} / 5
        </span>
      </div>

      <div className="pt-1">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-[10px] text-gray-500 shrink-0 hidden md:inline w-28 text-right font-medium">
            {lowLabel}
          </span>
          <div className="grid grid-cols-5 gap-2 flex-1 max-w-md">
            {[1, 2, 3, 4, 5].map((num) => {
              const isSelected = value === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num)}
                  className={`py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-green text-white shadow-sm ring-2 ring-brand-green/30 scale-[1.03]'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-gray-500 shrink-0 hidden md:inline w-28 font-medium">
            {highLabel}
          </span>
        </div>
        <div className="flex justify-between md:hidden text-[10px] text-gray-500 font-medium mt-1.5 px-1 max-w-md">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    </div>
  );
};
