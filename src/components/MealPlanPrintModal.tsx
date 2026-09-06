import React, { useState } from 'react';
import {
  X,
  Printer,
  ExternalLink,
  Download,
  Copy,
  Check,
  Utensils,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';
import { MealPlan } from '../types';
import {
  generateMealPlanPrintableHtml,
  openPrintableHtmlInNewTab,
  downloadPrintableHtml,
  generateMealPlanWhatsAppText,
} from '../lib/printUtils';

interface MealPlanPrintModalProps {
  plan: MealPlan;
  userName?: string;
  userEmail?: string;
  onClose: () => void;
}

export default function MealPlanPrintModal({
  plan,
  userName = 'Member',
  userEmail = '',
  onClose,
}: MealPlanPrintModalProps) {
  const [copied, setCopied] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Calculate totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  for (const slot of plan.meals || []) {
    for (const item of slot.items || []) {
      totalCalories += item.calories || 0;
      totalProtein += item.protein || 0;
      totalCarbs += item.carbs || 0;
      totalFats += item.fats || 0;
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const htmlContent = generateMealPlanPrintableHtml(plan, userName, userEmail);

  const handlePrint = () => {
    setPrintError(null);
    try {
      // In iframes, direct window.print() might be blocked
      window.print();
    } catch (err: unknown) {
      console.warn('Direct print blocked by iframe sandbox, falling back to new tab:', err);
      setPrintError('Direct print was blocked by the browser frame. Opening in a new tab instead...');
      openPrintableHtmlInNewTab(htmlContent, `${plan.name}_Diet_Plan`);
    }
  };

  const handleOpenTab = () => {
    const opened = openPrintableHtmlInNewTab(htmlContent, `${plan.name}_Diet_Plan`);
    if (!opened) {
      setPrintError('Browser blocked popup window. HTML file has been downloaded instead!');
    }
  };

  const handleDownload = () => {
    downloadPrintableHtml(htmlContent, `${plan.name}_Diet_Plan`);
  };

  const handleCopyWhatsApp = async () => {
    const text = generateMealPlanWhatsAppText(plan, userName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Modal Top Control Bar */}
        <div className="p-4 sm:p-5 bg-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Print & Export Meal Plan</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  PDF Ready
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Choose to print directly, open an unrestricted printable tab, or copy for WhatsApp.
              </p>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
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
              onClick={handleCopyWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border border-emerald-800"
              title="Copy formatted text to send via WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'WhatsApp'}</span>
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
            <div className="border-b-2 border-brand-green pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-brand-light-green text-brand-dark-green">
                    <Utensils className="w-5 h-5" />
                  </span>
                  <h1 className="text-2xl font-black text-brand-dark-green tracking-tight">FITKODE</h1>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Personalized Nutrition & Metabolic Coaching</p>
                <div className="mt-3">
                  <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                  <p className="text-xs text-gray-600">
                    Diet Preference: <strong className="text-gray-900">{plan.dietType || 'Vegetarian'}</strong>
                  </p>
                </div>
              </div>

              <div className="sm:text-right text-xs text-gray-600 space-y-1">
                <div>Member: <strong className="text-gray-900">{userName}</strong></div>
                {userEmail && <div className="text-[11px] text-gray-500">{userEmail}</div>}
                <div>Date: <strong className="text-gray-900">{currentDate}</strong></div>
                <div>Coach: <strong className="text-brand-dark-green">{plan.coachName || 'Chinmay Jain (INFS Certified)'}</strong></div>
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
                        Self-Created Plan
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Coach Directive Box */}
            {plan.coachNotes && (
              <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950">
                <strong className="block mb-1 text-purple-900 font-bold">Coach Instructions:</strong>
                <p className="leading-relaxed">{plan.coachNotes}</p>
              </div>
            )}

            {/* Macro Targets Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2 border-r border-emerald-200/60 last:border-none">
                <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Calories</p>
                <p className="text-xl font-black text-gray-900">{Math.round(totalCalories)}</p>
                <p className="text-[10px] text-gray-500">Target: {plan.targetCalories || totalCalories} kcal</p>
              </div>
              <div className="p-2 sm:border-r border-emerald-200/60">
                <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Protein</p>
                <p className="text-xl font-black text-emerald-700">{Math.round(totalProtein)}g</p>
                <p className="text-[10px] text-gray-500">Target: {plan.targetProtein || totalProtein}g</p>
              </div>
              <div className="p-2 border-r border-emerald-200/60">
                <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Carbohydrates</p>
                <p className="text-xl font-black text-amber-700">{Math.round(totalCarbs)}g</p>
                <p className="text-[10px] text-gray-500">Target: {plan.targetCarbs || totalCarbs}g</p>
              </div>
              <div className="p-2">
                <p className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">Fats</p>
                <p className="text-xl font-black text-indigo-700">{Math.round(totalFats)}g</p>
                <p className="text-[10px] text-gray-500">Target: {plan.targetFats || totalFats}g</p>
              </div>
            </div>

            {/* Meal Slots List */}
            <div className="space-y-4">
              {(plan.meals || []).map((slot, sIdx) => {
                let slotCals = 0;
                let slotP = 0;
                let slotC = 0;
                let slotF = 0;

                for (const item of slot.items || []) {
                  slotCals += item.calories || 0;
                  slotP += item.protein || 0;
                  slotC += item.carbs || 0;
                  slotF += item.fats || 0;
                }

                return (
                  <div key={slot.id || sIdx} className="border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase text-brand-green bg-brand-light-green px-2 py-0.5 rounded-md">
                          Meal {sIdx + 1}
                        </span>
                        <strong className="text-xs font-bold text-gray-900">{slot.name}</strong>
                        {slot.time && <span className="text-xs text-gray-500">({slot.time})</span>}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-600 flex items-center space-x-2">
                        <span className="text-emerald-700">P: {Math.round(slotP * 10) / 10}g</span>
                        <span>&bull;</span>
                        <span className="text-amber-700">C: {Math.round(slotC * 10) / 10}g</span>
                        <span>&bull;</span>
                        <span className="text-indigo-700">F: {Math.round(slotF * 10) / 10}g</span>
                        <span>&bull;</span>
                        <strong className="text-gray-900">{Math.round(slotCals)} kcal</strong>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 bg-white">
                          <th className="py-2 px-4">Food Item</th>
                          <th className="py-2 px-4">Portion / Weight</th>
                          <th className="py-2 px-4 text-right">Protein</th>
                          <th className="py-2 px-4 text-right">Carbs</th>
                          <th className="py-2 px-4 text-right">Fats</th>
                          <th className="py-2 px-4 text-right">Calories</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(slot.items || []).map((item, iIdx) => (
                          <tr key={item.id || iIdx} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-4 font-semibold text-gray-900">{item.name}</td>
                            <td className="py-2.5 px-4 text-gray-600">{item.servingSize || '-'}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-emerald-700">{item.protein || 0}g</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-amber-700">{item.carbs || 0}g</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-indigo-700">{item.fats || 0}g</td>
                            <td className="py-2.5 px-4 text-right font-bold text-gray-900">{item.calories || 0}</td>
                          </tr>
                        ))}
                        {(!slot.items || slot.items.length === 0) && (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-gray-400 italic">
                              No food items in this meal slot.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Guidelines */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <strong className="font-bold text-amber-900">Adherence & Nutrition Notes:</strong>
              <ul className="list-disc list-inside space-y-1 text-amber-900/90 leading-relaxed text-[11px]">
                <li>Weigh food items in raw, uncooked state prior to preparation for maximum accuracy.</li>
                <li>Stay well hydrated: consume 3 to 4 liters of clean water daily.</li>
                <li>Aim to spread protein intake across 3 to 4 meals to optimize protein synthesis and satiety.</li>
                <li>You can adjust or substitute ingredients in your Fitkode dashboard anytime.</li>
              </ul>
            </div>

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
