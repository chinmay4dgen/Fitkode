import { MealPlan, WorkoutPlan } from '../types';
import { formatISTDateTime } from './timestampUtils';

/**
 * Generate a standalone, self-contained printable HTML document for a Meal Plan
 */
export function generateMealPlanPrintableHtml(
  plan: MealPlan,
  userName = 'Member',
  userEmail = ''
): string {
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

  const currentDate = formatISTDateTime(plan.updatedAt || plan.createdAt || new Date().toISOString());

  const mealsHtml = (plan.meals || [])
    .map((slot, index) => {
      let slotCals = 0;
      let slotP = 0;
      let slotC = 0;
      let slotF = 0;

      const itemsRows = (slot.items || [])
        .map((item) => {
          slotCals += item.calories || 0;
          slotP += item.protein || 0;
          slotC += item.carbs || 0;
          slotF += item.fats || 0;

          return `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827;">${item.name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${item.servingSize || '-'}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #047857; font-weight: 700;">${item.protein || 0}g</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #b45309;">${item.carbs || 0}g</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #4338ca;">${item.fats || 0}g</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #111827;">${item.calories || 0}</td>
          </tr>
        `;
        })
        .join('');

      return `
      <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
        <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #10b981; margin-right: 8px;">Meal ${index + 1}</span>
            <strong style="font-size: 14px; color: #1e293b;">${slot.name}</strong>
            ${slot.time ? `<span style="font-size: 12px; color: #64748b; margin-left: 8px;">(${slot.time})</span>` : ''}
          </div>
          <div style="font-size: 11px; color: #475569; font-weight: 600;">
            <span style="color: #047857;">P: ${Math.round(slotP * 10) / 10}g</span> &bull; 
            <span style="color: #b45309;">C: ${Math.round(slotC * 10) / 10}g</span> &bull; 
            <span style="color: #4338ca;">F: ${Math.round(slotF * 10) / 10}g</span> &bull; 
            <strong style="color: #0f172a;">${Math.round(slotCals)} kcal</strong>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background-color: #ffffff; color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Food Item</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Portion / Weight</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">Protein</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">Carbs</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">Fats</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">Calories</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #9ca3af;">No food items in this meal slot.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${plan.name} - Fitkode Nutrition Prescription</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      line-height: 1.4;
    }
    .print-controls {
      background: #111827;
      color: white;
      padding: 12px 18px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .print-controls button {
      background: #10b981;
      color: white;
      border: none;
      padding: 8px 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
    }
    .print-controls button:hover {
      background: #059669;
    }
    @media print {
      .print-controls {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
    }
    .header {
      border-bottom: 2px solid #10b981;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-title {
      font-size: 24px;
      font-weight: 900;
      color: #047857;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .logo-subtitle {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #4b5563;
    }
    .target-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      text-align: center;
    }
    .target-col {
      border-right: 1px solid #dcfce7;
    }
    .target-col:last-child {
      border-right: none;
    }
    .target-value {
      font-size: 18px;
      font-weight: 800;
      color: #065f46;
      margin-top: 2px;
    }
    .target-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #047857;
    }
    .target-sub {
      font-size: 10px;
      color: #6b7280;
    }
    .coach-notes-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #581c87;
    }
    .guidelines {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 12px 16px;
      margin-top: 20px;
      font-size: 11px;
      color: #92400e;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <div>
      <strong>Fitkode Nutrition Prescription</strong> &bull; Print or Save as PDF
    </div>
    <div>
      <button onclick="window.print()">Print / Save PDF</button>
    </div>
  </div>

  <div class="header">
    <div>
      <h1 class="logo-title">FITKODE</h1>
      <div class="logo-subtitle">Personalized Nutrition & Metabolic Coaching</div>
      <div style="margin-top: 8px; font-size: 16px; font-weight: bold; color: #111827;">${plan.name}</div>
      <div style="font-size: 12px; color: #6b7280;">Diet Type: <strong>${plan.dietType || 'Vegetarian'}</strong></div>
    </div>
    <div class="meta-box">
      <div>Member: <strong style="color: #111827;">${userName}</strong></div>
      ${userEmail ? `<div style="font-size: 11px; color: #6b7280;">${userEmail}</div>` : ''}
      <div>Prescription Date: <strong>${currentDate}</strong></div>
      <div>Coach: <strong style="color: #047857;">${plan.coachName || 'Chinmay Jain (INFS Certified)'}</strong></div>
      <div style="margin-top: 4px;"><span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${plan.createdBy === 'coach' ? 'Coach Assigned' : 'Member Custom Plan'}</span></div>
    </div>
  </div>

  ${
    plan.coachNotes
      ? `<div class="coach-notes-box">
          <strong style="display: block; margin-bottom: 4px; color: #6b21a8;">Coach Instructions:</strong>
          ${plan.coachNotes}
        </div>`
      : ''
  }

  <div class="target-banner">
    <div class="target-col">
      <div class="target-label">Daily Calories</div>
      <div class="target-value">${Math.round(totalCalories)}</div>
      <div class="target-sub">Target: ${plan.targetCalories || totalCalories} kcal</div>
    </div>
    <div class="target-col">
      <div class="target-label">Protein</div>
      <div class="target-value" style="color: #047857;">${Math.round(totalProtein)}g</div>
      <div class="target-sub">Target: ${plan.targetProtein || totalProtein}g</div>
    </div>
    <div class="target-col">
      <div class="target-label">Carbohydrates</div>
      <div class="target-value" style="color: #b45309;">${Math.round(totalCarbs)}g</div>
      <div class="target-sub">Target: ${plan.targetCarbs || totalCarbs}g</div>
    </div>
    <div class="target-col">
      <div class="target-label">Dietary Fats</div>
      <div class="target-value" style="color: #4338ca;">${Math.round(totalFats)}g</div>
      <div class="target-sub">Target: ${plan.targetFats || totalFats}g</div>
    </div>
  </div>

  <div>
    ${mealsHtml}
  </div>

  <div class="guidelines">
    <strong>Key Nutritional Adherence Guidelines:</strong>
    <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.5;">
      <li>Weigh raw grains, pulses (dal, rice, oats) and proteins prior to cooking for optimal accuracy.</li>
      <li>Maintain daily hydration between 3 to 4 liters of water.</li>
      <li>Spacing meals by 3 to 4 hours sustains muscle protein synthesis and smooth glycemic control.</li>
      <li>For any adjustments or substitutions, log in to your Fitkode dashboard or reach out directly to your coach.</li>
    </ul>
  </div>

  <div class="footer">
    <div>Fitkode Coaching &bull; fitkode.com &bull; Designed by Coach Chinmay Jain</div>
    <div>Strict Confidentiality Guaranteed &bull; Document ID: ${plan.id}</div>
  </div>

</body>
</html>`;
}

/**
 * Generate a standalone, self-contained printable HTML document for a Workout Plan
 */
export function generateWorkoutPlanPrintableHtml(
  plan: WorkoutPlan,
  userName = 'Member',
  userEmail = ''
): string {
  const currentDate = formatISTDateTime(plan.updatedAt || plan.createdAt || new Date().toISOString());

  const daysHtml = (plan.days || [])
    .map((day, dIdx) => {
      const exRows = (day.exercises || [])
        .map((ex, exIdx) => {
          return `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111827;">${exIdx + 1}. ${ex.name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 11px;">${ex.targetMuscle || '-'}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 700; color: #4338ca;">${ex.sets || 3}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #111827;">${ex.reps || '8-12'}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${ex.restSeconds ? `${ex.restSeconds}s` : '90s'}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 11px;">${ex.notes || '-'}</td>
          </tr>
        `;
        })
        .join('');

      return `
      <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
        <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6366f1; margin-right: 8px;">Day ${dIdx + 1}</span>
            <strong style="font-size: 14px; color: #1e293b;">${day.dayName}</strong>
            <span style="font-size: 12px; color: #64748b; margin-left: 8px;">&bull; ${day.focus}</span>
          </div>
          <span style="font-size: 11px; font-weight: bold; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px;">
            ${(day.exercises || []).length} Exercises
          </span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background-color: #ffffff; color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Exercise</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Target Muscle</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">Sets</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">Reps / Cadence</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">Rest</th>
              <th style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Form Cues / Notes</th>
            </tr>
          </thead>
          <tbody>
            ${exRows || '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #9ca3af;">No exercises scheduled for this training session.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${plan.name} - Fitkode Training Routine</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      line-height: 1.4;
    }
    .print-controls {
      background: #111827;
      color: white;
      padding: 12px 18px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .print-controls button {
      background: #6366f1;
      color: white;
      border: none;
      padding: 8px 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
    }
    .print-controls button:hover {
      background: #4f46e5;
    }
    @media print {
      .print-controls {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
    }
    .header {
      border-bottom: 2px solid #6366f1;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-title {
      font-size: 24px;
      font-weight: 900;
      color: #4338ca;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .logo-subtitle {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #4b5563;
    }
    .target-banner {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      text-align: center;
    }
    .target-col {
      border-right: 1px solid #e0e7ff;
    }
    .target-col:last-child {
      border-right: none;
    }
    .target-value {
      font-size: 16px;
      font-weight: 800;
      color: #3730a3;
      margin-top: 2px;
    }
    .target-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4338ca;
    }
    .coach-notes-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #581c87;
    }
    .guidelines {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-top: 20px;
      font-size: 11px;
      color: #166534;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <div>
      <strong>Fitkode Training Routine</strong> &bull; Print or Save as PDF
    </div>
    <div>
      <button onclick="window.print()">Print / Save PDF</button>
    </div>
  </div>

  <div class="header">
    <div>
      <h1 class="logo-title">FITKODE</h1>
      <div class="logo-subtitle">Structured Resistance Training & Hypertrophy Program</div>
      <div style="margin-top: 8px; font-size: 16px; font-weight: bold; color: #111827;">${plan.name}</div>
      <div style="font-size: 12px; color: #6b7280;">Difficulty: <strong>${plan.difficulty || 'Intermediate'}</strong></div>
    </div>
    <div class="meta-box">
      <div>Member: <strong style="color: #111827;">${userName}</strong></div>
      ${userEmail ? `<div style="font-size: 11px; color: #6b7280;">${userEmail}</div>` : ''}
      <div>Program Date: <strong>${currentDate}</strong></div>
      <div>Coach: <strong style="color: #4338ca;">${plan.coachName || 'Chinmay Jain (INFS Certified)'}</strong></div>
      <div style="margin-top: 4px;"><span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${plan.createdBy === 'coach' ? 'Coach Prescribed' : 'Member Routine'}</span></div>
    </div>
  </div>

  ${
    plan.coachNotes
      ? `<div class="coach-notes-box">
          <strong style="display: block; margin-bottom: 4px; color: #6b21a8;">Coach Training Directives:</strong>
          ${plan.coachNotes}
        </div>`
      : ''
  }

  <div class="target-banner">
    <div class="target-col">
      <div class="target-label">Primary Goal</div>
      <div class="target-value">${plan.goal || 'Hypertrophy'}</div>
    </div>
    <div class="target-col">
      <div class="target-label">Frequency</div>
      <div class="target-value">${plan.daysPerWeek || (plan.days ? plan.days.length : 4)} Days / Week</div>
    </div>
    <div class="target-col">
      <div class="target-label">Total Workout Days</div>
      <div class="target-value">${(plan.days || []).length} Split Days</div>
    </div>
  </div>

  <div>
    ${daysHtml}
  </div>

  <div class="guidelines">
    <strong>Training Execution Directives:</strong>
    <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.5;">
      <li>Perform 5-10 minutes of dynamic mobility and joint warm-ups before lifting working sets.</li>
      <li>Warm-up sets do not count towards working sets. Maintain 1-2 Reps in Reserve (RIR) on compound lifts.</li>
      <li>Prioritize controlled eccentric cadence (2-3 seconds down) and full range of motion over sheer weight.</li>
      <li>Log weights lifted progressively each week to stimulate progressive overload.</li>
    </ul>
  </div>

  <div class="footer">
    <div>Fitkode Coaching &bull; fitkode.com &bull; Designed by Coach Chinmay Jain</div>
    <div>Strict Confidentiality Guaranteed &bull; Document ID: ${plan.id}</div>
  </div>

</body>
</html>`;
}

/**
 * Robust cross-browser execution: Opens printable HTML in a clean tab with fallback download
 */
export function openPrintableHtmlInNewTab(htmlContent: string, fileNameTitle: string): boolean {
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Attempt to open new window
    const newWindow = window.open(blobUrl, '_blank');
    
    // If popup blocked or null in iframe, fall back to triggering a download link
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.download = `${fileNameTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_fitkode.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to open print tab:', err);
    return false;
  }
}

/**
 * Downloads the HTML file directly
 */
export function downloadPrintableHtml(htmlContent: string, fileNameTitle: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `${fileNameTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_fitkode.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

/**
 * Generate formatted WhatsApp / text summary for a Meal Plan
 */
export function generateMealPlanWhatsAppText(
  plan: MealPlan,
  userName = 'Member'
): string {
  let text = `🥗 *FITKODE NUTRITION PLAN: ${plan.name.toUpperCase()}*\n`;
  text += `👤 *Member:* ${userName}\n`;
  text += `🎯 *Daily Targets:* ${plan.targetCalories || '-'} kcal | P: ${plan.targetProtein || '-'}g | C: ${plan.targetCarbs || '-'}g | F: ${plan.targetFats || '-'}g\n`;
  if (plan.coachNotes) {
    text += `📝 *Coach Notes:* ${plan.coachNotes}\n`;
  }
  text += `────────────────────\n\n`;

  (plan.meals || []).forEach((slot, idx) => {
    text += `*MEAL ${idx + 1}: ${slot.name}* ${slot.time ? `(${slot.time})` : ''}\n`;
    if (!slot.items || slot.items.length === 0) {
      text += `  • (No items specified)\n`;
    } else {
      slot.items.forEach((item) => {
        text += `  • ${item.name} (${item.servingSize || '1 portion'}) - ${item.calories || 0} kcal (P: ${item.protein || 0}g, C: ${item.carbs || 0}g, F: ${item.fats || 0}g)\n`;
      });
    }
    text += `\n`;
  });

  text += `────────────────────\n`;
  text += `💧 *Daily Guidelines:* 3-4L water, weigh ingredients raw. Stay consistent!\n`;
  text += `Coach Chinmay Jain • Fitkode`;

  return text;
}
