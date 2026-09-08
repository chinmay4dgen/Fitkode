import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  User,
  ShieldCheck,
  X,
  FileText,
  Utensils,
  Dumbbell,
  Sparkles,
} from 'lucide-react';
import {
  CommunicationLogItem,
  CommunicationConfig,
  fetchCommunicationLogs,
  fetchCommunicationConfig,
  sendTestCommunication,
} from '../lib/communicationService';

interface CommunicationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
}

export const CommunicationCenterModal: React.FC<CommunicationCenterModalProps> = ({
  isOpen,
  onClose,
  adminEmail,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [logs, setLogs] = useState<CommunicationLogItem[]>([]);
  const [config, setConfig] = useState<CommunicationConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<CommunicationLogItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'weekly_tracker_submission' | 'diet_plan_assigned' | 'workout_plan_assigned' | 'welcome_email' | 'test'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<'html' | 'text'>('html');

  const loadCommunicationData = async () => {
    try {
      setLoading(true);
      const [fetchedLogs, fetchedConfig] = await Promise.all([
        fetchCommunicationLogs(adminEmail),
        fetchCommunicationConfig(adminEmail),
      ]);
      setLogs(fetchedLogs);
      setConfig(fetchedConfig);
    } catch (err) {
      console.error('Error fetching communication center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCommunicationData();
    }
  }, [isOpen, adminEmail]);

  if (!isOpen) return null;

  const handleSendTestEmail = async () => {
    try {
      setSendingTest(true);
      const targetEmail = config?.coachEmail || 'myfitkode@gmail.com';
      const res = await sendTestCommunication(targetEmail, adminEmail);
      if (res.success && res.log) {
        setLogs((prev) => [res.log!, ...prev]);
        setFeedback({
          type: 'success',
          message: `Verification test email dispatched to ${targetEmail} (${res.log.status.toUpperCase()}).`,
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        throw new Error(res.error || 'Failed to dispatch test notification.');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to send test email.',
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setSendingTest(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = activeFilter === 'all' || log.type === activeFilter;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesFilter;

    const matchesSearch =
      log.to.toLowerCase().includes(query) ||
      log.subject.toLowerCase().includes(query) ||
      (log.recipientName && log.recipientName.toLowerCase().includes(query)) ||
      log.previewText.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const getLogTypeBadge = (type: CommunicationLogItem['type']) => {
    switch (type) {
      case 'weekly_tracker_submission':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <FileText className="w-3 h-3" />
            <span>Weekly Check-in &rarr; Coach</span>
          </span>
        );
      case 'diet_plan_assigned':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Utensils className="w-3 h-3" />
            <span>Diet Plan &rarr; Member</span>
          </span>
        );
      case 'workout_plan_assigned':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
            <Dumbbell className="w-3 h-3" />
            <span>Workout Plan &rarr; Member</span>
          </span>
        );
      case 'welcome_email':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
            <Sparkles className="w-3 h-3 text-teal-700" />
            <span>Welcome Email &rarr; Member</span>
          </span>
        );
      case 'test':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
            <Sparkles className="w-3 h-3" />
            <span>Test Verification</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatIST = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id="communication-center-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Mail className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Communication &amp; Notification Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  Live Triggers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/80 mt-0.5">
                Automated email delivery pipeline for Coach Weekly Check-ins and Member Plan Assignments.
              </p>
            </div>
          </div>
          <button
            id="close-communication-center-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar & Configuration Strip */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-emerald-950 font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Coach Recipient Email: <strong className="font-bold text-emerald-900">myfitkode@gmail.com</strong>
              </span>
            </div>
            <div className="hidden sm:inline text-emerald-300">•</div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                Delivery Mode:{' '}
                <strong className="font-bold text-emerald-900">
                  {config?.isConfigured ? 'Live SMTP Transport (Active)' : 'Verified Mail Delivery Engine'}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="refresh-communication-logs-btn"
              onClick={loadCommunicationData}
              disabled={loading}
              className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              id="send-test-communication-btn"
              onClick={handleSendTestEmail}
              disabled={sendingTest}
              className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${sendingTest ? 'animate-pulse' : ''}`} />
              <span>{sendingTest ? 'Dispatching...' : 'Send Test Notification'}</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              <span>{feedback.message}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          {/* Functional Flow Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50/40 p-4 rounded-2xl border border-teal-200/80">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-teal-950">1. Gmail Login Welcome Trigger</h4>
                  <p className="text-xs text-teal-800/80 mt-1 leading-relaxed">
                    Whenever a user logs in with Gmail, Fitkode automatically delivers the energetic Welcome email to motivate them, assure them they made the right choice, and launch their 3-step fitness roadmap.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4 rounded-2xl border border-emerald-200/80">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">2. Client Weekly Check-in Trigger</h4>
                  <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                    Whenever any logged-in member submits their weekly check-in (measurements, steps, workouts, reflections), an email is automatically dispatched to Coach Chinmay at <strong>myfitkode@gmail.com</strong> with full body stats.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50/40 p-4 rounded-2xl border border-indigo-200/80">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm mt-0.5">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">3. Member Plan Assignment Trigger</h4>
                  <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
                    Whenever Coach assigns a Diet Plan or Workout Routine to a member, an email is automatically dispatched with complete nutritional targets, split breakdown, and coach guidance notes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Emails ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('welcome_email')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'welcome_email'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Welcome Emails
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('weekly_tracker_submission')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'weekly_tracker_submission'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Weekly Check-ins &rarr; Coach
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('diet_plan_assigned')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'diet_plan_assigned'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Diet Plans &rarr; Member
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('workout_plan_assigned')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'workout_plan_assigned'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Workouts &rarr; Member
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient or subject..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-xs font-semibold">Loading communication logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50/50">
              <Mail className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">No emails matched your criteria</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Trigger a weekly check-in from a member account, assign a plan, or click "Send Test Notification" above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-gray-200 hover:border-emerald-300 rounded-2xl p-4 transition-all shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getLogTypeBadge(log.type)}
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          log.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status === 'failed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {log.status === 'sent' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {log.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-600" />}
                        <span>{log.status}</span>
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatIST(log.sentAt)}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {log.subject}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span>
                        Recipient: <strong className="text-gray-800 font-semibold">{log.to}</strong>
                        {log.recipientName && <span className="text-gray-400"> ({log.recipientName})</span>}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 truncate max-w-md">
                        {log.previewText}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-xl bg-gray-50 hover:bg-emerald-50 text-emerald-800 border border-gray-200 hover:border-emerald-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview Email</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            <span>Fitkode Notification Architecture • DPDPA Compliant Consent Synchronized</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Nested Email Preview Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-60 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
        >
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gray-900 p-4 sm:p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Email Dispatch Viewer
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-md mt-0.5">
                  {selectedLog.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta Info Strip */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">To:</span>
                <span className="font-bold text-gray-900">{selectedLog.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">From:</span>
                <span className="font-medium text-gray-700">{selectedLog.from}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Dispatched:</span>
                <span className="font-medium text-gray-700">{formatIST(selectedLog.sentAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="font-bold uppercase text-emerald-700">{selectedLog.status}</span>
              </div>
            </div>

            {/* Toggle HTML vs Text */}
            <div className="flex border-b border-gray-200 bg-gray-100 px-4 pt-2">
              <button
                onClick={() => setPreviewTab('html')}
                className={`px-4 py-1.5 text-xs font-bold rounded-t-lg transition-colors cursor-pointer ${
                  previewTab === 'html'
                    ? 'bg-white text-emerald-800 border-t border-x border-gray-200 -mb-px'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Visual Email Preview
              </button>
              <button
                onClick={() => setPreviewTab('text')}
                className={`px-4 py-1.5 text-xs font-bold rounded-t-lg transition-colors cursor-pointer ${
                  previewTab === 'text'
                    ? 'bg-white text-emerald-800 border-t border-x border-gray-200 -mb-px'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Plain Text View
              </button>
            </div>

            {/* Body Preview */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              {previewTab === 'html' ? (
                <div
                  className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: selectedLog.html }}
                />
              ) : (
                <pre className="p-4 bg-gray-900 text-green-400 rounded-xl text-xs whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed">
                  {selectedLog.text || selectedLog.previewText}
                </pre>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="py-1.5 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
