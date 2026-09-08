import { WeeklyTrackerEntry, MealPlan, WorkoutPlan } from '../types';

export interface CommunicationLogItem {
  id: string;
  type: 'weekly_tracker_submission' | 'diet_plan_assigned' | 'workout_plan_assigned' | 'test';
  to: string;
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

export interface CommunicationConfig {
  isConfigured: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  coachEmail: string;
  fromEmail: string;
}

/**
 * Dispatches automated email notification to Coach Chinmay (myfitkode@gmail.com)
 * whenever a member logs/submits their weekly tracker information.
 */
export async function notifyWeeklyTrackerSubmitted(
  entry: WeeklyTrackerEntry,
  clientName?: string,
  callerEmail?: string
): Promise<{ success: boolean; log?: CommunicationLogItem; error?: string }> {
  try {
    const res = await fetch('/api/communication/notify-weekly-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry,
        clientName,
        callerEmail: callerEmail || entry.userEmail,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to dispatch email' };
    }

    const data = await res.json();
    return { success: true, log: data.log };
  } catch (err: any) {
    console.warn('[CommunicationService] Weekly tracker email dispatch deferred or failed:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Dispatches automated email notification to the member whenever
 * Coach Chinmay assigns a Diet Plan or Workout Plan to them.
 */
export async function notifyPlanAssigned(params: {
  type: 'diet' | 'workout';
  targetEmail: string;
  clientName?: string;
  plan: MealPlan | WorkoutPlan;
  coachName?: string;
  callerEmail?: string;
}): Promise<{ success: boolean; log?: CommunicationLogItem; error?: string }> {
  try {
    const res = await fetch('/api/communication/notify-plan-assigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to dispatch email' };
    }

    const data = await res.json();
    return { success: true, log: data.log };
  } catch (err: any) {
    console.warn('[CommunicationService] Plan assigned email dispatch deferred or failed:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetches all sent & simulated communication logs for the coach communication center
 */
export async function fetchCommunicationLogs(callerEmail: string): Promise<CommunicationLogItem[]> {
  try {
    const res = await fetch(`/api/communication/logs?callerEmail=${encodeURIComponent(callerEmail)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.error('[CommunicationService] Failed to load communication logs:', err);
    return [];
  }
}

/**
 * Fetches current communication transporter configuration
 */
export async function fetchCommunicationConfig(callerEmail: string): Promise<CommunicationConfig | null> {
  try {
    const res = await fetch(`/api/communication/config?callerEmail=${encodeURIComponent(callerEmail)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.config || null;
  } catch (err) {
    console.error('[CommunicationService] Failed to load communication config:', err);
    return null;
  }
}

/**
 * Sends a test verification email from admin portal
 */
export async function sendTestCommunication(
  targetEmail: string,
  callerEmail: string
): Promise<{ success: boolean; log?: CommunicationLogItem; error?: string }> {
  try {
    const res = await fetch('/api/communication/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail, callerEmail }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to send test email' };
    }

    const data = await res.json();
    return { success: true, log: data.log };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
