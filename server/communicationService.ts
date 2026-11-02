import nodemailer from 'nodemailer';

export interface CommunicationLog {
  id: string;
  type: 'weekly_tracker_submission' | 'diet_plan_assigned' | 'workout_plan_assigned' | 'welcome_email' | 'test' | 'consultation_inquiry';
  to: string;
  bcc?: string;
  from: string;
  subject: string;
  previewText: string;
  html: string;
  text: string;
  status: 'sent' | 'simulated' | 'failed';
  sentAt: string;
  recipientName?: string;
  metadata?: Record<string, any>;
  error?: string;
}

const COACH_EMAIL = process.env.COACH_NOTIFICATION_EMAIL || 'myfitkode@gmail.com';
const FROM_EMAIL = process.env.MAIL_FROM || '"Fitkode Coaching" <myfitkode@gmail.com>';

// Always ensure myfitkode@gmail.com receives copies of all notifications
export function getCoachCopyEmails(excludeRecipient?: string): string[] {
  const rawList = [
    'myfitkode@gmail.com',
    process.env.COACH_NOTIFICATION_EMAIL || '',
    process.env.SMTP_USER || '',
  ]
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && e.includes('@'));

  const unique = Array.from(new Set(rawList));
  if (!excludeRecipient) return unique;
  const normExclude = excludeRecipient.trim().toLowerCase();
  return unique.filter((e) => e !== normExclude);
}

// In-memory communication history for admin portal (populated at runtime)
const communicationLogs: CommunicationLog[] = [];

export function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


let mailTransporter: any = null;

export function getMailTransporterConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  const isConfigured = Boolean(user && pass);

  return {
    isConfigured,
    host,
    port,
    secure,
    user: user ? `${user.substring(0, 3)}***` : 'Not set',
    coachEmail: COACH_EMAIL,
    coachCopyEmails: getCoachCopyEmails(),
    fromEmail: FROM_EMAIL,
  };
}

function getMailTransporter(): any {
  const { isConfigured, host, port, secure } = getMailTransporterConfig();
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!isConfigured) {
    return null;
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return mailTransporter;
}

// =========================================================================
// HTML TEMPLATE BUILDERS
// =========================================================================

function getEmailBaseStyles() {
  return `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937;
    background-color: #f9fafb;
    margin: 0;
    padding: 24px 12px;
  `;
}

/**
 * Weekly Tracker Submission Notification Email sent to Coach Chinmay (myfitkode@gmail.com)
 */
export function buildWeeklyTrackerEmail(params: {
  entry: any;
  clientName?: string;
  appUrl?: string;
}): { subject: string; html: string; text: string; previewText: string } {
  const { entry, clientName, appUrl = 'https://fitkode.com' } = params;
  const fullName = clientName || `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || entry.userEmail;
  const weekNum = entry.weekNumber || 1;
  const checkInDate = entry.checkInDate || new Date().toISOString().split('T')[0];

  const subject = `[Fitkode Weekly Check-in] New Tracker Submission: ${fullName} (Week ${weekNum})`;
  const previewText = `${fullName} submitted Week ${weekNum} check-in. Weight: ${entry.weightKg || 'N/A'} kg, Steps: ${entry.avgStepsPerDay || 0}/day.`;

  const adminReviewUrl = `${appUrl}/admin/members?email=${encodeURIComponent(entry.userEmail)}`;
  const safeSubject = escapeHtml(subject);
  const safeFullName = escapeHtml(fullName);
  const safeUserEmail = escapeHtml(entry.userEmail);
  const safeCheckInDate = escapeHtml(checkInDate);
  const safeWeekNum = escapeHtml(weekNum);
  const safeWeight = entry.weightKg ? `${escapeHtml(entry.weightKg)} kg` : 'N/A';
  const safeWaist = entry.waistInches ? `${escapeHtml(entry.waistInches)} in` : 'N/A';
  const safeHips = entry.hipsInches ? `${escapeHtml(entry.hipsInches)} in` : 'N/A';
  const safeChest = entry.chestInches ? `${escapeHtml(entry.chestInches)} in` : 'N/A';
  const safeSteps = entry.avgStepsPerDay ? escapeHtml(entry.avgStepsPerDay.toLocaleString()) : 'N/A';
  const safeResistance = entry.resistanceWorkoutDays ? `${escapeHtml(entry.resistanceWorkoutDays)} days` : '0 days';
  const safeChallenges = entry.challengesFaced
    ? escapeHtml(entry.challengesFaced).replace(/\r?\n/g, '<br/>')
    : 'No specific challenges reported for this week.';
  const safeAdminReviewUrl = escapeHtml(adminReviewUrl);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeSubject}</title>
</head>
<body style="${getEmailBaseStyles()}">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ecfdf5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">
                      Client Check-In Alert
                    </span>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.5px;">
                      Fitkode Coaching Hub
                    </h1>
                    <p style="color: #a7f3d0; font-size: 13px; margin: 0;">
                      New Weekly Health & Body Metrics Submission
                    </p>
                  </td>
                  <td align="right" valign="top" style="font-size: 28px;">
                    📋
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              
              <!-- Member Info Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="4">
                      <tr>
                        <td width="35%" style="font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Member Name:</td>
                        <td style="font-size: 14px; font-weight: 700; color: #111827;">${safeFullName}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Email Address:</td>
                        <td style="font-size: 13px; color: #047857; font-weight: 600;">${safeUserEmail}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Check-in Date:</td>
                        <td style="font-size: 13px; color: #374151;">${safeCheckInDate}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Program Week:</td>
                        <td style="font-size: 13px; color: #111827; font-weight: 700;"><span style="background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 6px;">Week ${safeWeekNum}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Body Measurements & Statistics Grid -->
              <h3 style="font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 12px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
                Body Measurements & Activity Stats
              </h3>
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="48%" style="padding: 12px; background-color: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase;">Current Weight</div>
                    <div style="font-size: 22px; font-weight: 800; color: #064e3b; margin-top: 4px;">${safeWeight}</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 12px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase;">Waist Circumference</div>
                    <div style="font-size: 22px; font-weight: 800; color: #14532d; margin-top: 4px;">${safeWaist}</div>
                  </td>
                </tr>
                <tr><td colspan="3" height="10"></td></tr>
                <tr>
                  <td width="48%" style="padding: 12px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Hips</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 2px;">${safeHips}</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 12px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Chest</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 2px;">${safeChest}</div>
                  </td>
                </tr>
                <tr><td colspan="3" height="10"></td></tr>
                <tr>
                  <td width="48%" style="padding: 12px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Daily Steps (Avg)</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 2px;">${safeSteps}</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 12px; background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Resistance Training</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 2px;">${safeResistance}</div>
                  </td>
                </tr>
              </table>

              <!-- Client Reflections / Challenges -->
              <div style="margin-bottom: 28px;">
                <h3 style="font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 8px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
                  Client Feedback &amp; Challenges Faced
                </h3>
                <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <em>&ldquo;${safeChallenges}&rdquo;</em>
                </div>
              </div>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${safeAdminReviewUrl}" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Review Member in Coach Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; font-size: 11px; color: #6b7280;">
                Review full progress charts, body photos, and formulate custom program adjustments.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; font-size: 11px; color: #6b7280; line-height: 1.5;">
              <strong>Fitkode Automated Coaching Communications</strong><br>
              This notification was generated automatically because a member submitted their weekly health tracker.<br>
              Coach inbox: <strong>myfitkode@gmail.com</strong>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
[Fitkode Weekly Check-in Alert]
Member: ${fullName} (${entry.userEmail})
Week: Week ${weekNum} | Date: ${checkInDate}

Body Statistics:
- Weight: ${entry.weightKg || 'N/A'} kg
- Waist: ${entry.waistInches || 'N/A'} in
- Hips: ${entry.hipsInches || 'N/A'} in
- Chest: ${entry.chestInches || 'N/A'} in
- Daily Steps: ${entry.avgStepsPerDay || 'N/A'}
- Resistance Training: ${entry.resistanceWorkoutDays || 0} days
- Cardio: ${entry.hiitCardioDays || 0} days

Challenges & Notes:
"${entry.challengesFaced || 'No challenges reported'}"

Review this member in the Coach Portal:
${adminReviewUrl}
  `.trim();

  return { subject, html, text, previewText };
}

/**
 * Diet Plan Assigned Notification Email sent to Client
 */
export function buildDietPlanAssignedEmail(params: {
  targetEmail: string;
  clientName: string;
  plan: any;
  coachName?: string;
  appUrl?: string;
}): { subject: string; html: string; text: string; previewText: string } {
  const { targetEmail, clientName, plan, coachName = 'Chinmay Jain', appUrl = 'https://fitkode.com' } = params;
  const firstName = clientName ? clientName.split(' ')[0] : 'there';
  const planUrl = `${appUrl}/meal-planner`;

  const subject = `🥗 Your Tailored Nutrition Plan is Ready: ${plan.name}`;
  const previewText = `Coach ${coachName} has designed and assigned your personalized meal plan (${plan.targetCalories} kcal, ${plan.targetProtein}g Protein).`;

  const safeSubject = escapeHtml(subject);
  const safeCoachName = escapeHtml(coachName);
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(plan.name);
  const safeDietType = escapeHtml(plan.dietType || 'Custom');
  const safeTargetCalories = escapeHtml(plan.targetCalories);
  const safeTargetProtein = escapeHtml(plan.targetProtein);
  const safeTargetCarbs = escapeHtml(plan.targetCarbs);
  const safeTargetFats = escapeHtml(plan.targetFats);
  const safeCoachNotes = plan.coachNotes
    ? escapeHtml(plan.coachNotes).replace(/\r?\n/g, '<br/>')
    : '';
  const safePlanUrl = escapeHtml(planUrl);
  const safeAppUrl = escapeHtml(appUrl);

  const mealsList = (plan.meals || []).map((m: any, idx: number) => {
    const itemsSummary = (m.items || []).map((it: any) => escapeHtml(it.name)).join(', ') || 'Custom foods';
    return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #111827;">${escapeHtml(m.name || `Meal ${idx + 1}`)}</td>
        <td style="padding: 10px 0; font-size: 12px; color: #4b5563; text-align: right;">${itemsSummary}</td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeSubject}</title>
</head>
<body style="${getEmailBaseStyles()}">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ecfdf5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">
                      Custom Coaching Update
                    </span>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.5px;">
                      Your Nutrition Plan is Ready!
                    </h1>
                    <p style="color: #a7f3d0; font-size: 13px; margin: 0;">
                      Assigned by Coach ${safeCoachName}
                    </p>
                  </td>
                  <td align="right" valign="top" style="font-size: 28px;">
                    🥗
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 15px; color: #1f2937; margin: 0 0 16px 0; line-height: 1.6;">
                Hi <strong>${safeFirstName}</strong>,
              </p>
              <p style="font-size: 14px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
                Great news! Coach <strong>${safeCoachName}</strong> has carefully reviewed your profile, dietary preferences, and metabolic targets, and has assigned a customized meal plan directly to your Fitkode account:
              </p>

              <!-- Plan Name Card -->
              <div style="background-color: #ecfdf5; border-left: 4px solid #047857; border-radius: 0 12px 12px 0; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">Active Nutrition Plan</div>
                <div style="font-size: 18px; font-weight: 800; color: #064e3b; margin-top: 2px;">${safePlanName}</div>
                <div style="font-size: 12px; color: #047857; margin-top: 4px; font-weight: 600;">Diet Preference: ${safeDietType}</div>
              </div>

              <!-- Macros Target Grid -->
              <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Daily Target Breakdown
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="23%" style="padding: 12px 8px; background-color: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Calories</div>
                    <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 2px;">${safeTargetCalories}</div>
                    <div style="font-size: 9px; color: #9ca3af;">kcal/day</div>
                  </td>
                  <td width="2%"></td>
                  <td width="23%" style="padding: 12px 8px; background-color: #ecfdf5; border-radius: 10px; border: 1px solid #a7f3d0; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: #065f46; text-transform: uppercase;">Protein</div>
                    <div style="font-size: 16px; font-weight: 800; color: #064e3b; margin-top: 2px;">${safeTargetProtein}g</div>
                    <div style="font-size: 9px; color: #047857;">target</div>
                  </td>
                  <td width="2%"></td>
                  <td width="23%" style="padding: 12px 8px; background-color: #fffbeb; border-radius: 10px; border: 1px solid #fde68a; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: #92400e; text-transform: uppercase;">Carbs</div>
                    <div style="font-size: 16px; font-weight: 800; color: #78350f; margin-top: 2px;">${safeTargetCarbs}g</div>
                    <div style="font-size: 9px; color: #b45309;">target</div>
                  </td>
                  <td width="2%"></td>
                  <td width="23%" style="padding: 12px 8px; background-color: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: #1e40af; text-transform: uppercase;">Fats</div>
                    <div style="font-size: 16px; font-weight: 800; color: #1e3a8a; margin-top: 2px;">${safeTargetFats}g</div>
                    <div style="font-size: 9px; color: #2563eb;">target</div>
                  </td>
                </tr>
              </table>

              <!-- Coach's Notes -->
              ${safeCoachNotes ? `
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Coach's Guidelines
                </h3>
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; color: #374151; font-size: 13px; line-height: 1.6;">
                  ${safeCoachNotes}
                </div>
              </div>
              ` : ''}

              <!-- Meal Schedule Preview -->
              ${mealsList ? `
              <div style="margin-bottom: 28px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Meal Schedule Snapshot
                </h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #f3f4f6;">
                  ${mealsList}
                </table>
              </div>
              ` : ''}

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${safePlanUrl}" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Open Your Meal Plan &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; font-size: 12px; color: #6b7280;">
                This plan is immediately active in your account. You can track food items, swap ingredients, and view detailed macros.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; font-size: 11px; color: #6b7280; line-height: 1.5;">
              <strong>Fitkode Coaching</strong> • Science-Backed Nutrition &amp; Fitness<br>
              Questions about this plan? You can reply to this email or message Coach Chinmay directly at <strong>myfitkode@gmail.com</strong>.<br>
              To manage communication settings, visit your <a href="${safeAppUrl}/profile" style="color: #047857; text-decoration: underline;">Privacy &amp; Data Center</a>.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Hi ${firstName},

Coach ${coachName} has designed and assigned your tailored nutrition plan:
${plan.name}

Targets:
- Daily Calories: ${plan.targetCalories} kcal
- Protein: ${plan.targetProtein}g
- Carbs: ${plan.targetCarbs}g
- Fats: ${plan.targetFats}g
- Diet Type: ${plan.dietType || 'Custom'}

Coach Notes:
${plan.coachNotes || 'Follow the portion sizes and meal timings outlined in your plan.'}

Open your active Meal Plan in Fitkode:
${planUrl}

Fitkode Coaching • myfitkode@gmail.com
  `.trim();

  return { subject, html, text, previewText };
}

/**
 * Workout Plan Assigned Notification Email sent to Client
 */
export function buildWorkoutPlanAssignedEmail(params: {
  targetEmail: string;
  clientName: string;
  plan: any;
  coachName?: string;
  appUrl?: string;
}): { subject: string; html: string; text: string; previewText: string } {
  const { targetEmail, clientName, plan, coachName = 'Chinmay Jain', appUrl = 'https://fitkode.com' } = params;
  const firstName = clientName ? clientName.split(' ')[0] : 'there';
  const planUrl = `${appUrl}/workout-planner`;

  const subject = `💪 Your Custom Workout Routine is Ready: ${plan.name}`;
  const previewText = `Coach ${coachName} has designed your custom workout routine (${plan.daysPerWeek || 4} days/week, ${plan.goal || 'Hypertrophy'}).`;

  const safeSubject = escapeHtml(subject);
  const safeCoachName = escapeHtml(coachName);
  const safeCoachFirstName = escapeHtml(coachName.split(' ')[0]);
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(plan.name);
  const safeGoal = escapeHtml(plan.goal || 'General Fitness & Muscle Gain');
  const safeDaysPerWeek = escapeHtml(plan.daysPerWeek || (plan.days ? plan.days.length : 4));
  const safeDifficulty = escapeHtml(plan.difficulty || 'Intermediate');
  const safeCoachNotes = plan.coachNotes
    ? escapeHtml(plan.coachNotes).replace(/\r?\n/g, '<br/>')
    : '';
  const safePlanUrl = escapeHtml(planUrl);
  const safeAppUrl = escapeHtml(appUrl);

  const daysList = (plan.days || []).map((d: any, idx: number) => {
    const exCount = (d.exercises || []).length;
    return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #111827;">${escapeHtml(d.dayName || `Day ${idx + 1}`)}</td>
        <td style="padding: 10px 0; font-size: 12px; color: #4b5563;">${escapeHtml(d.focus || (d.isRestDay ? 'Active Recovery' : 'Resistance'))}</td>
        <td style="padding: 10px 0; font-size: 12px; color: #047857; text-align: right; font-weight: 600;">
          ${d.isRestDay ? '<span style="color:#6b7280;">Rest Day</span>' : `${exCount} exercises`}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeSubject}</title>
</head>
<body style="${getEmailBaseStyles()}">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #e0e7ff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">
                      Custom Training Regimen
                    </span>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.5px;">
                      Your Workout Plan is Ready!
                    </h1>
                    <p style="color: #c7d2fe; font-size: 13px; margin: 0;">
                      Designed by Coach ${safeCoachName}
                    </p>
                  </td>
                  <td align="right" valign="top" style="font-size: 28px;">
                    🏋️
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 15px; color: #1f2937; margin: 0 0 16px 0; line-height: 1.6;">
                Hi <strong>${safeFirstName}</strong>,
              </p>
              <p style="font-size: 14px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
                Coach <strong>${safeCoachName}</strong> has built and assigned a custom training routine tailored to your fitness baseline, weekly schedule, and physique goals:
              </p>

              <!-- Routine Name Card -->
              <div style="background-color: #eef2ff; border-left: 4px solid #4f46e5; border-radius: 0 12px 12px 0; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: #3730a3; text-transform: uppercase; letter-spacing: 0.5px;">Active Training Split</div>
                <div style="font-size: 18px; font-weight: 800; color: #1e1b4b; margin-top: 2px;">${safePlanName}</div>
                <div style="font-size: 12px; color: #4338ca; margin-top: 4px; font-weight: 600;">Primary Goal: ${safeGoal}</div>
              </div>

              <!-- Training Specs Grid -->
              <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Training Specifications
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="32%" style="padding: 12px; background-color: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Frequency</div>
                    <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 2px;">${safeDaysPerWeek} Days</div>
                    <div style="font-size: 9px; color: #9ca3af;">per week</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="padding: 12px; background-color: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Difficulty</div>
                    <div style="font-size: 16px; font-weight: 800; color: #111827; margin-top: 2px;">${safeDifficulty}</div>
                    <div style="font-size: 9px; color: #9ca3af;">level</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="padding: 12px; background-color: #eef2ff; border-radius: 10px; border: 1px solid #c7d2fe; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; color: #3730a3; text-transform: uppercase;">Coach</div>
                    <div style="font-size: 15px; font-weight: 800; color: #1e1b4b; margin-top: 2px;">${safeCoachFirstName}</div>
                    <div style="font-size: 9px; color: #4338ca;">Assigned</div>
                  </td>
                </tr>
              </table>

              <!-- Coach's Notes -->
              ${safeCoachNotes ? `
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Coach's Technique &amp; Rest Advice
                </h3>
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; color: #374151; font-size: 13px; line-height: 1.6;">
                  ${safeCoachNotes}
                </div>
              </div>
              ` : ''}

              <!-- Training Days Breakdown -->
              ${daysList ? `
              <div style="margin-bottom: 28px;">
                <h3 style="font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  Weekly Schedule Breakdown
                </h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #f3f4f6;">
                  ${daysList}
                </table>
              </div>
              ` : ''}

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${safePlanUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Open Your Workout Regimen &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; font-size: 12px; color: #6b7280;">
                All exercise demonstrations, sets, rep ranges, and rest timers are available inside your workout dashboard.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; font-size: 11px; color: #6b7280; line-height: 1.5;">
              <strong>Fitkode Coaching</strong> • Personalized Training &amp; Hypertrophy<br>
              Questions about this workout split? Reply directly to this email or reach Coach Chinmay at <strong>myfitkode@gmail.com</strong>.<br>
              To manage notifications, visit your <a href="${safeAppUrl}/profile" style="color: #4f46e5; text-decoration: underline;">Privacy &amp; Data Center</a>.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Hi ${firstName},

Coach ${coachName} has designed and assigned your custom workout plan:
${plan.name}

Specs:
- Goal: ${plan.goal || 'Hypertrophy & Muscle Gain'}
- Frequency: ${plan.daysPerWeek || 4} days/week
- Difficulty: ${plan.difficulty || 'Intermediate'}

Coach Notes:
${plan.coachNotes || 'Focus on progressive overload and perfect form on compound lifts.'}

Open your Workout Regimen in Fitkode:
${planUrl}

Fitkode Coaching • myfitkode@gmail.com
  `.trim();

  return { subject, html, text, previewText };
}

/**
 * Builds the high-energy "Welcome to Fitkode" onboarding email sent when a user logs in with Gmail.
 */
export function buildWelcomeEmail(params: {
  targetEmail: string;
  clientName?: string;
  appUrl?: string;
}): {
  subject: string;
  html: string;
  text: string;
  previewText: string;
} {
  const { targetEmail, clientName, appUrl = 'https://fitkode.com' } = params;
  const rawName = (clientName || targetEmail.split('@')[0] || 'Champion').trim();
  const firstName = rawName.split(' ')[0] || rawName;
  const profileUrl = `${appUrl.replace(/\/$/, '')}/profile`;
  const safeFirstName = escapeHtml(firstName);
  const safeProfileUrl = escapeHtml(profileUrl);
  const safeTargetEmail = escapeHtml(targetEmail);

  const subject = `Welcome to Fitkode, ${firstName}! 🔥 You’ve made the right choice — let’s crush your goals together!`;
  const previewText = `Your journey to peak fitness starts right now. Coach Chinmay and Team Fitkode have your back every step of the way.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Fitkode!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 28px 12px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Energetic Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0d9488 100%); padding: 36px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.18); color: #a7f3d0; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.2);">
                      ⚡ Official Welcome
                    </span>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; line-height: 1.2; letter-spacing: -0.5px;">
                      Welcome to Fitkode! 🔥
                    </h1>
                    <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">
                      You have made the very right choice. Let’s crush your fitness goals together!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Core Message Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 16px 0;">
                Hey ${safeFirstName}, you’re officially in! 💥
              </h2>

              <p style="font-size: 15px; line-height: 1.65; color: #374151; margin: 0 0 16px 0;">
                First of all, congratulations. Deciding to prioritize your health, energy, and strength is a huge commitment, and <strong>you have made the absolute right choice</strong> by joining Fitkode.
              </p>

              <p style="font-size: 15px; line-height: 1.65; color: #374151; margin: 0 0 24px 0;">
                From this moment on, you are not navigating this alone. <strong>Together, we will crush your fitness goals.</strong> No gimmicks, no extreme starving — just evidence-based training, smart nutrition, and consistent accountability.
              </p>

              <!-- Energetic Highlight Callout -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; margin: 0 0 28px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                      💪 The Fitkode Promise
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #14532d; line-height: 1.55;">
                      Stay consistent, log your progress, and trust the process. You bring the effort, and we bring the roadmap!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- 3-Step Action Plan -->
              <h3 style="font-size: 16px; font-weight: 800; color: #111827; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                🚀 Your 3-Step Kickoff Plan:
              </h3>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <!-- Step 1 -->
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" valign="top" style="padding-top: 2px;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #047857; color: #ffffff; border-radius: 8px; font-size: 13px; font-weight: 800; text-align: center; line-height: 28px;">1</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <strong style="color: #111827; font-size: 14px;">Complete Your Onboarding Assessment</strong>
                          <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.4;">
                            Tell us your current stats, goals, and diet preference in under 2 minutes so we can tailor your coaching.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 2 -->
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" valign="top" style="padding-top: 2px;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #047857; color: #ffffff; border-radius: 8px; font-size: 13px; font-weight: 800; text-align: center; line-height: 28px;">2</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <strong style="color: #111827; font-size: 14px;">Review Your Diet &amp; Workout Blueprint</strong>
                          <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.4;">
                            Access your daily macro targets, customized meal suggestions, and training splits directly in your dashboard.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Step 3 -->
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" valign="top" style="padding-top: 2px;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #047857; color: #ffffff; border-radius: 8px; font-size: 13px; font-weight: 800; text-align: center; line-height: 28px;">3</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <strong style="color: #111827; font-size: 14px;">Lock in Your Weekly Tracker Check-In</strong>
                          <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.4;">
                            Record your weekly weight, tape measurements, and check-in notes so Coach Chinmay can review your progress.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Call-to-Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${safeProfileUrl}" style="display: inline-block; background-color: #047857; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 16px 36px; border-radius: 14px; box-shadow: 0 4px 14px rgba(4, 120, 87, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                      ⚡ Open Your Fitkode Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Coach Sign-off -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <tr>
                  <td>
                    <p style="font-size: 14px; color: #374151; margin: 0 0 4px 0; font-weight: 700;">
                      Let's make it happen,
                    </p>
                    <p style="font-size: 15px; color: #111827; margin: 0; font-weight: 800;">
                      Coach Chinmay &amp; The Fitkode Team
                    </p>
                    <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">
                      Direct Coaching Support: <a href="mailto:myfitkode@gmail.com" style="color: #047857; text-decoration: underline;">myfitkode@gmail.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Fitkode Performance Coaching • DPDPA Compliant Consent Synchronized
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #9ca3af;">
                You received this email because you logged in to Fitkode with your Google account (${safeTargetEmail}).
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Welcome to Fitkode, ${firstName}! 🔥
You’ve made the very right choice — let’s crush your fitness goals together!

Hey ${firstName}, you’re officially in! 💥

First things first: Welcome to Fitkode. You have made the very right choice for your body, your mindset, and your health.

Starting today, you are no longer doing this alone. We are in this together, and together, we will absolutely CRUSH your fitness goals. 🚀

Whether you want to drop stubborn fat, build lean muscle, dial in your nutrition, or build unstoppable daily discipline — you now have the exact system, science-backed planning, and direct coaching in your corner.

YOUR 3-STEP KICKOFF PLAN:
1. Complete Your Onboarding Assessment (2 mins)
2. Review Your Diet & Workout Blueprint in your dashboard
3. Lock in Your Weekly Tracker Check-In so Coach Chinmay can review your progress

Open your Fitkode Dashboard:
${profileUrl}

Let's make it happen!

Coach Chinmay & The Fitkode Team
myfitkode@gmail.com
  `.trim();

  return { subject, html, text, previewText };
}

/**
 * Sends or logs an email notification.
 * If SMTP credentials are configured, sends real email via nodemailer.
 * If not configured yet, logs with simulated delivery so all records are visible and trackable in the admin communication center.
 */
export async function sendEmailNotification(params: {
  type: CommunicationLog['type'];
  to: string;
  subject: string;
  html: string;
  text: string;
  previewText: string;
  recipientName?: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; log: CommunicationLog }> {
  const { type, to, subject, html, text, previewText, recipientName, metadata } = params;
  const now = new Date().toISOString();
  const id = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Trim recipient and validate
  let cleanTo = typeof to === 'string' ? to.trim() : '';
  if ((!cleanTo || !cleanTo.includes('@')) && (type === 'weekly_tracker_submission' || type === 'consultation_inquiry')) {
    cleanTo = COACH_EMAIL;
  }

  // Compute coach copy recipients (always includes myfitkode@gmail.com unless already the primary recipient)
  const coachCopyList = getCoachCopyEmails(cleanTo);
  const bccString = coachCopyList.join(', ');
  const allCoachEmails = getCoachCopyEmails();
  const isCustomerRecipient = Boolean(cleanTo && !allCoachEmails.includes(cleanTo.toLowerCase()));

  const log: CommunicationLog = {
    id,
    type,
    to: cleanTo || 'unspecified@fitkode.ai',
    bcc: bccString || undefined,
    from: FROM_EMAIL,
    subject,
    previewText,
    html,
    text,
    status: 'simulated',
    sentAt: now,
    recipientName,
    metadata: {
      ...metadata,
      coachCopySentTo: bccString || cleanTo,
    },
  };

  const transporter = getMailTransporter();

  // Only attempt live SMTP delivery if a valid recipient email with '@' is defined
  if (transporter && cleanTo && cleanTo.includes('@')) {
    try {
      console.log(
        `[CommunicationService] Sending live email via SMTP to: ${cleanTo}${bccString ? ` (BCC: ${bccString})` : ''} (Subject: "${subject}")`
      );
      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to: cleanTo,
        bcc: coachCopyList.length > 0 ? coachCopyList : undefined,
        replyTo: COACH_EMAIL,
        subject,
        text,
        html,
      });
      console.log(`[CommunicationService] Email sent successfully! MessageId: ${info.messageId}`);

      // Gmail suppresses self-BCCs from appearing as unread items in the sender's own Inbox (only placing them in Sent).
      // When notifying a customer, also dispatch an explicit [Sent Copy] to coach emails so it appears visibly in the myfitkode@gmail.com Inbox as well as Sent.
      if (isCustomerRecipient && allCoachEmails.length > 0) {
        const copyBannerHtml = `
          <div style="background-color:#ecfdf5;border:1px solid #10b981;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#065f46;">
            <strong>📬 Fitkode Coach Sent Copy</strong><br/>
            <span>This is an exact copy of the notification sent to <strong>${escapeHtml(recipientName || cleanTo)}</strong> (&lt;${escapeHtml(cleanTo)}&gt;) at ${new Date(now).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.</span>
          </div>
        `;
        transporter
          .sendMail({
            from: FROM_EMAIL,
            to: allCoachEmails,
            replyTo: cleanTo,
            subject: `[Sent Copy → ${recipientName || cleanTo}] ${subject}`,
            text: `[Fitkode Coach Sent Copy — Dispatched to ${recipientName || cleanTo} <${cleanTo}>]\n\n${text}`,
            html: `${copyBannerHtml}${html}`,
          })
          .catch((copyErr: any) => {
            console.warn('[CommunicationService] Coach inbox copy notice:', copyErr?.message || copyErr);
          });
      }

      log.status = 'sent';
      log.metadata = {
        ...log.metadata,
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error(`[CommunicationService] Failed to send live email via SMTP:`, err);
      log.status = 'failed';
      log.error = err?.message || 'SMTP delivery failure';
    }
  } else if (transporter && (!cleanTo || !cleanTo.includes('@'))) {
    console.warn(`[CommunicationService] Skipping SMTP delivery: No valid recipient defined for notification (${type}). Recorded in communication center.`);
    log.status = 'failed';
    log.error = 'No recipients defined';
  } else {
    console.log(`[CommunicationService] (Sandbox/Simulated) Email prepared for ${cleanTo || 'unspecified recipient'} (Coach Copy BCC: ${bccString || 'none'}):`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Preview: ${previewText}`);
    log.status = 'simulated';
  }

  // Prepend to logs
  communicationLogs.unshift(log);

  // Keep last 150 items
  if (communicationLogs.length > 150) {
    communicationLogs.pop();
  }

  return { success: true, log };
}

export function getAllCommunicationLogs(): CommunicationLog[] {
  return [...communicationLogs];
}
