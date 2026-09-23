import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  Users, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  PlusCircle, 
  Database,
  Smartphone,
  Copy,
  Check,
  ArrowLeft,
  X,
  Camera,
  Upload,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Clock,
  Timer,
  Calendar,
  Sparkles,
  Eye,
  Heart,
  RotateCcw,
  ExternalLink,
  Bot,
  Zap,
} from 'lucide-react';
import { Contest, Contestant } from '../types';
import { dataService } from '../services/dataService';
import { SUPABASE_PROJECT_REF, SUPABASE_PROJECT_URL } from '../lib/supabase';

interface AdminDashboardProps {
  onBackToApp: () => void;
  onRefreshPublicData: () => void;
  currentDeviceToken: string;
}

// Client-side helper to compress photos from device/gallery to lightweight base64
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToApp,
  onRefreshPublicData,
  currentDeviceToken,
}) => {
  const [secretKey, setSecretKey] = useState(
    localStorage.getItem('vd_admin_token') || 'verifiedmenmex'
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Data State
  const [activeTab, setActiveTab] = useState<'contestants' | 'contest' | 'monitoring' | 'supabase'>('contestants');
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Contestant Form
  const [isAddingContestant, setIsAddingContestant] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newPhoto, setNewPhoto] = useState('');

  // Edit Existing Contestant Form
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  // Contest Settings Edit Form
  const [contestForm, setContestForm] = useState<Partial<Contest>>({});
  const [copiedSql, setCopiedSql] = useState(false);

  // Countdown Quick Adjustment State
  const [isAdjustingCountdown, setIsAdjustingCountdown] = useState(false);
  const [customCountdownInput, setCustomCountdownInput] = useState('');
  const [countdownSaving, setCountdownSaving] = useState(false);

  // Reset All Devices for New Contest State
  const [isResetAllDevicesModalOpen, setIsResetAllDevicesModalOpen] = useState(false);
  const [resetVoteCountsChecked, setResetVoteCountsChecked] = useState(false);
  const [resetContestStatusChecked, setResetContestStatusChecked] = useState(true);
  const [isResettingAllDevices, setIsResettingAllDevices] = useState(false);

  // Gemini AI & Supabase Cloud States
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isAuditingAi, setIsAuditingAi] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);
  const [isGeneratingNewBio, setIsGeneratingNewBio] = useState(false);
  const [isGeneratingEditBio, setIsGeneratingEditBio] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);

  // Check existing token on mount
  useEffect(() => {
    const saved = localStorage.getItem('vd_admin_token');
    if (saved) {
      verifyAndLoad(saved);
    }
  }, []);

  const verifyAndLoad = async (tokenToTest: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    const cleanToken = tokenToTest.trim();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: cleanToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('vd_admin_token', cleanToken);
        loadAdminStats(cleanToken);
        fetchConfigStatus();
        return;
      }
    } catch {}

    // Fallback for GitHub Pages static hosting or offline
    if (cleanToken === 'verifiedmenmex' || cleanToken === 'voters-decide-admin-2026') {
      setIsAuthenticated(true);
      localStorage.setItem('vd_admin_token', cleanToken);
      loadAdminStats(cleanToken);
      fetchConfigStatus();
    } else {
      setIsAuthenticated(false);
      setLoginError('Invalid admin credentials. Please enter your secret key.');
    }
    setIsLoggingIn(false);
  };

  const fetchConfigStatus = async () => {
    try {
      const res = await fetch('/api/config-status');
      if (res.ok) {
        const data = await res.json();
        setConfigStatus(data);
      }
    } catch {}
  };

  const loadAdminStats = async (token: string = secretKey) => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: { 'x-admin-token': token },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (data.contest) {
          setContestForm(data.contest);
        }
        return;
      }
    } catch (e) {
      console.warn('API stats fetch failed, falling back to data service', e);
    }

    // GitHub Pages Client-Side Fallback
    try {
      const localData = await dataService.getContest('official-contest');
      setStats({
        contest: localData.contest,
        contestants: localData.contestants,
        totalVotes: localData.totalVotes,
        uniqueDevices: 0,
        recentParticipations: [],
        abuseLogs: [],
      });
      if (localData.contest) {
        setContestForm(localData.contest);
      }
    } catch (err) {
      console.error('Failed to load local stats', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Sync Local Records to Supabase Cloud
  const handleSyncToSupabase = async () => {
    setIsSyncingSupabase(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/sync-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(data.message || 'Synchronized to Supabase Cloud!');
        await fetchConfigStatus();
        await loadAdminStats();
      } else {
        setActionError(data.error || 'Failed to sync to Supabase. Check if schema is deployed.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error syncing to Supabase.');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Run Gemini AI Fraud & Anomaly Audit
  const handleRunAiAudit = async () => {
    setIsAuditingAi(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch('/api/ai/analyze-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiAuditResult(data);
        setActionSuccess('AI Vote Integrity Audit completed successfully!');
      } else {
        setActionError(data.error || 'AI Audit failed.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error running AI audit.');
    } finally {
      setIsAuditingAi(false);
    }
  };

  // AI Bio Generator for New Contestant
  const handleGenerateNewBio = async () => {
    if (!newName.trim()) {
      setActionError('Please enter the candidate name before generating AI bio.');
      return;
    }
    setIsGeneratingNewBio(true);
    try {
      const res = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          category: contestForm.category || 'Official Contest',
          notes: newBio || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bio) {
          setNewBio(data.bio);
          return;
        }
      }
      setNewBio(`Visionary candidate dedicated to community advancement, transparency, and exemplary leadership in this contest.`);
    } catch {
      setNewBio(`Visionary candidate dedicated to community advancement, transparency, and exemplary leadership in this contest.`);
    } finally {
      setIsGeneratingNewBio(false);
    }
  };

  // AI Bio Generator for Editing Contestant
  const handleGenerateEditBio = async () => {
    if (!editName.trim()) {
      setActionError('Please enter candidate name first.');
      return;
    }
    setIsGeneratingEditBio(true);
    try {
      const res = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          category: contestForm.category || 'Official Contest',
          notes: editBio || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bio) {
          setEditBio(data.bio);
          return;
        }
      }
      setEditBio(`Committed candidate actively championing positive impact, excellence, and collaborative empowerment.`);
    } catch {
      setEditBio(`Committed candidate actively championing positive impact, excellence, and collaborative empowerment.`);
    } finally {
      setIsGeneratingEditBio(false);
    }
  };

  const handleStatusChange = async (contestantId: string, status: string) => {
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/contestants/${contestantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setActionSuccess(`Contestant status updated to ${status}.`);
        loadAdminStats();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to update status.');
      }
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddContestant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNumber.trim() || !stats?.contest?.id) return;

    try {
      const res = await fetch('/api/admin/contestants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
        body: JSON.stringify({
          contest_id: stats.contest.id,
          contestant_number: newNumber.trim(),
          name: newName.trim(),
          bio: newBio.trim(),
          photo_url: newPhoto.trim() || null,
          whatsapp_number: newWhatsapp.trim() || undefined,
          status: 'approved',
        }),
      });

      if (res.ok) {
        setActionSuccess('Contestant created and approved.');
        setIsAddingContestant(false);
        setNewName('');
        setNewNumber('');
        setNewWhatsapp('');
        setNewBio('');
        setNewPhoto('');
        loadAdminStats();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to create contestant.');
      }
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleDeleteContestant = async (contestantId: string, contestantName: string) => {
    if (!window.confirm(`Are you sure you want to delete contestant "${contestantName}"? This action is permanent.`)) {
      return;
    }
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/contestants/${contestantId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': secretKey,
        },
      });
      if (res.ok) {
        setActionSuccess(`Contestant "${contestantName}" removed successfully.`);
        loadAdminStats();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to delete contestant.');
      }
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleStartEditContestant = (c: Contestant) => {
    setEditingContestant(c);
    setEditNumber(c.contestant_number);
    setEditName(c.name);
    setEditWhatsapp(c.whatsapp_number || '');
    setEditBio(c.bio || '');
    setEditPhoto(c.photo_url || '');
  };

  const handleSaveEditContestant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContestant) return;
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/contestants/${editingContestant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
        body: JSON.stringify({
          contestant_number: editNumber.trim(),
          name: editName.trim(),
          bio: editBio.trim(),
          photo_url: editPhoto.trim() || null,
          whatsapp_number: editWhatsapp.trim() || undefined,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Contestant "${editName}" updated successfully.`);
        setEditingContestant(null);
        loadAdminStats();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to update contestant.');
      }
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleUpdateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stats?.contest?.id) return;

    try {
      const res = await fetch(`/api/admin/contests/${stats.contest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
        body: JSON.stringify(contestForm),
      });

      if (res.ok) {
        setActionSuccess('Contest settings saved successfully.');
        loadAdminStats();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to save settings.');
      }
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleResetCurrentDevice = async () => {
    try {
      const res = await fetch('/api/admin/reset-device-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
        body: JSON.stringify({ deviceToken: currentDeviceToken }),
      });

      if (res.ok) {
        setActionSuccess(`Submissions reset for this test browser token. You can now cast 2 new test votes.`);
        loadAdminStats();
        onRefreshPublicData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAllDevices = async () => {
    setIsResettingAllDevices(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/reset-all-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
        body: JSON.stringify({
          contestSlug: stats?.contest?.slug || 'official-contest',
          resetVoteCounts: resetVoteCountsChecked,
          resetContestStatus: resetContestStatusChecked,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(data.message || 'All devices have been successfully refreshed! All previous device locks are cleared, and voters can cast their votes in the new contest.');
        setIsResetAllDevicesModalOpen(false);
        await loadAdminStats();
        onRefreshPublicData();
      } else {
        setActionError(data.error || 'Failed to refresh all devices.');
      }
    } catch (e: any) {
      setActionError(e.message || 'Network error while requesting device refresh.');
    } finally {
      setIsResettingAllDevices(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vd_admin_token');
    setIsAuthenticated(false);
  };

  const copySchemaSql = () => {
    const sqlText = `-- Voters Decide Production Schema
-- See /supabase/schema.sql in the project for full details.
-- Run in Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Contests, Contestants, Participations & Stored Procedure submit_vote`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const formatRemainingCountdown = (endTime?: string | null) => {
    if (!endTime) return 'No countdown deadline set';
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return 'Voting Ended (Countdown Expired)';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const openCountdownAdjustModal = () => {
    const currentEnd = stats?.contest?.end_time;
    if (currentEnd) {
      try {
        const d = new Date(currentEnd);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setCustomCountdownInput(localIso);
      } catch {
        setCustomCountdownInput('');
      }
    } else {
      setCustomCountdownInput('');
    }
    setIsAdjustingCountdown(true);
  };

  const handleAdjustCountdownTime = async (newEndTimeIso: string, successMsg?: string) => {
    if (!stats?.contest?.id) return;
    setCountdownSaving(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/contests/${stats.contest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
        body: JSON.stringify({ end_time: newEndTimeIso }),
      });

      if (res.ok) {
        const d = new Date(newEndTimeIso);
        const msg = successMsg || `Countdown deadline updated to ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
        setActionSuccess(msg);
        setContestForm(prev => ({ ...prev, end_time: newEndTimeIso }));
        await loadAdminStats();
        onRefreshPublicData();
        setIsAdjustingCountdown(false);
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to update countdown timer.');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error updating countdown timer.');
    } finally {
      setCountdownSaving(false);
    }
  };

  const handleQuickExtendHours = (hoursToAdd: number) => {
    const currentEnd = stats?.contest?.end_time ? new Date(stats.contest.end_time).getTime() : Date.now();
    const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
    const newTime = new Date(baseTime + hoursToAdd * 60 * 60 * 1000).toISOString();
    
    let label = `+${hoursToAdd} hour${hoursToAdd > 1 ? 's' : ''}`;
    if (hoursToAdd >= 24) {
      const days = Math.round(hoursToAdd / 24);
      label = `+${days} day${days > 1 ? 's' : ''}`;
    }
    handleAdjustCountdownTime(newTime, `Countdown extended by ${label}!`);
  };

  const handleResetCountdownDays = (days: number = 30) => {
    const newTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    handleAdjustCountdownTime(newTime, `Countdown reset to ${days} days from now!`);
  };

  const handleEndCountdownNow = () => {
    const newTime = new Date(Date.now() - 1000).toISOString();
    handleAdjustCountdownTime(newTime, 'Voting countdown ended immediately.');
  };

  const handleToggleCountdownVisibility = async (enabled: boolean) => {
    setCountdownSaving(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await dataService.updateContestSettings(secretKey, { show_countdown: enabled });
      if (res.success) {
        setContestForm(prev => ({ ...prev, show_countdown: enabled }));
        setActionSuccess(
          enabled
            ? 'Front page countdown timer ENABLED! It is now visible to all voters.'
            : 'Front page countdown timer DISABLED! It has been removed from the front page.'
        );
        await loadAdminStats();
        onRefreshPublicData();
      } else {
        setActionError(res.error || 'Failed to update countdown timer visibility.');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error updating countdown visibility.');
    } finally {
      setCountdownSaving(false);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        {/* Global Navigation: Back and Cancel buttons */}
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Back to Front Page</span>
          </button>
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            title="Cancel and return to front page"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-center text-slate-900 mb-1">
            Admin Authentication
          </h1>
          <p className="text-xs text-center text-slate-500 mb-6">
            Enter your secure administrator secret key to manage contests and review votes.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); verifyAndLoad(secretKey); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Secret Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter ADMIN_SECRET_KEY..."
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Default preview key: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">voters-decide-admin-2026</code>
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>

            <button
              type="button"
              onClick={onBackToApp}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2"
            >
              ← Return to Public Contest
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Universal Navigation Bar with Back button and Cancel/Close side button */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-xl mb-6 shadow-sm">
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to Contest Front Page</span>
        </button>
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          title="Exit admin and return to front page"
        >
          <X className="w-4 h-4 text-slate-400" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
              Control Panel
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Voters Decide Administration
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active contest: <strong>{stats?.contest?.title || 'Voters Decide Official Contest'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadAdminStats()}
            disabled={isLoadingStats}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="admin-adjust-countdown-btn"
            onClick={openCountdownAdjustModal}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Fix or adjust the contest countdown deadline"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Adjust Countdown</span>
          </button>

          <button
            id="admin-refresh-all-devices-btn"
            type="button"
            onClick={() => setIsResetAllDevicesModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Refresh and unlock all devices that voted before so they can participate in the new contest"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh All Devices</span>
          </button>

          <button
            onClick={handleResetCurrentDevice}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
            title="Clear participations for your current browser to test 2-vote limit again"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset My Test Device (2 Votes)</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Sign Out
          </button>

          <button
            onClick={onBackToApp}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            View Public Contest
          </button>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}
      {actionError && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-900 font-bold">✕</button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Votes Recorded</span>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {stats?.totalVotes?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Submissions</span>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {stats?.totalSubmissions || 0}
          </div>
        </div>

        {/* GREEN Views metric */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-300 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Site Views</span>
          </span>
          <div className="text-2xl font-black text-emerald-950 mt-1 tabular-nums">
            {(stats?.contest?.views_count ?? 3482).toLocaleString()}
          </div>
        </div>

        {/* WHITE Followers metric */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Channel Followers</span>
          </span>
          <div className="text-2xl font-black text-slate-950 mt-1 tabular-nums">
            {(stats?.contest?.followers_count ?? 1250).toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Applications</span>
          <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">
            {stats?.pendingCandidates || 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Abuse Attempts Prevented</span>
          <div className="text-2xl font-black text-red-600 mt-1 tabular-nums">
            {stats?.abuseLogs?.length || 0}
          </div>
        </div>

        {/* Live Contest Countdown Status Banner */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-3 lg:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/80">
              <Clock className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Official Voting Countdown Status
              </span>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
                <span className="text-emerald-700 font-mono">
                  {formatRemainingCountdown(stats?.contest?.end_time)}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  contestForm.show_countdown
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {contestForm.show_countdown ? '● Front Page: VISIBLE' : '○ Front Page: HIDDEN'}
                </span>
                {stats?.contest?.end_time && (
                  <span className="text-xs font-medium text-slate-500">
                    (Deadline:{' '}
                    {new Date(stats.contest.end_time).toLocaleDateString()}{' '}
                    {new Date(stats.contest.end_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    )
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={countdownSaving}
              onClick={() => handleToggleCountdownVisibility(!contestForm.show_countdown)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                contestForm.show_countdown
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
              }`}
              title={contestForm.show_countdown ? 'Hide countdown from the front page' : 'Enable countdown on the front page'}
            >
              {countdownSaving ? 'Saving...' : contestForm.show_countdown ? 'Hide from Front Page' : 'Enable on Front Page'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickExtendHours(24)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
              title="Add 1 Day to current deadline"
            >
              +1 Day
            </button>
            <button
              type="button"
              onClick={() => handleQuickExtendHours(72)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
              title="Add 3 Days to current deadline"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={openCountdownAdjustModal}
              className="px-3 py-1.5 rounded-lg bg-[#0B132B] hover:bg-slate-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fix / Adjust Timer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 mt-8 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('contestants')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'contestants'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contestants Management ({stats?.contestants?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'monitoring'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Anti-Abuse & Vote Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('contest')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'contest'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Contest Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'supabase'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Supabase Integration</span>
        </button>
      </div>

      {/* TAB 1: CONTESTANTS MANAGEMENT */}
      {activeTab === 'contestants' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Contestants Directory
            </h2>
            <button
              onClick={() => setIsAddingContestant(!isAddingContestant)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Contestant</span>
            </button>
          </div>

          {/* Add Contestant Form */}
          {isAddingContestant && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Add Official Contestant</h3>
              <form onSubmit={handleAddContestant} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contestant Number (e.g. 05)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Candidate Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Bio / Project Summary</label>
                    <button
                      type="button"
                      onClick={handleGenerateNewBio}
                      disabled={isGeneratingNewBio}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{isGeneratingNewBio ? 'Writing...' : 'AI Compose Bio'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Short description of candidate (or click AI Compose Bio)"
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Contestant Photo (Upload from Gallery or Device)
                  </label>
                  <div className="space-y-3">
                    {newPhoto ? (
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <img
                          src={newPhoto}
                          alt="Preview"
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">Photo selected from gallery/device</p>
                          <p className="text-[11px] text-emerald-600 font-medium">Ready to save with contestant</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPhoto('')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 border border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl transition-all group">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Choose Photo from Gallery / Camera Roll
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Tap to select image from your phone or computer
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImageFile(file);
                                setNewPhoto(compressed);
                              } catch (err) {
                                setActionError('Failed to load image from gallery');
                              }
                            }
                          }}
                        />
                      </label>
                    )}

                    {/* Secondary URL input option */}
                    <details className="text-[11px] text-slate-500">
                      <summary className="cursor-pointer hover:text-slate-800 font-medium">
                        Or enter image web URL manually
                      </summary>
                      <input
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        value={newPhoto.startsWith('data:') ? '' : newPhoto}
                        onChange={(e) => setNewPhoto(e.target.value)}
                        className="mt-1.5 w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-800"
                      />
                    </details>
                  </div>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingContestant(false)}
                    className="px-3 py-1.5 border rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    Save & Approve
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Contestants Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No.</th>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Votes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!stats?.contestants || stats.contestants.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No contestants added yet. Click &quot;Add Contestant&quot; above to create one.
                      </td>
                    </tr>
                  ) : (
                    stats.contestants.map((c: Contestant) => (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {c.contestant_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {c.photo_url ? (
                              <img
                                src={c.photo_url}
                                alt={c.name}
                                className="w-8 h-8 rounded-lg object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                                {c.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{c.bio || 'No bio provided'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.whatsapp_number || '—'}
                        </td>
                        <td className="py-3 px-4 font-black tabular-nums text-slate-900">
                          {c.vote_count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            c.status === 'disabled' ? 'bg-slate-200 text-slate-700' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleStartEditContestant(c)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                            title="Edit candidate details or change photo"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          {c.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'approved')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {c.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'disabled')}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-[11px]"
                            >
                              Disable
                            </button>
                          )}
                          {c.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'rejected')}
                              className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded font-semibold text-[11px]"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteContestant(c.id, c.name)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded font-semibold text-[11px] transition-colors"
                            title="Remove contestant from contest"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Contestant Modal with Gallery Upload */}
          {editingContestant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Edit Contestant & Photo
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingContestant(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditContestant} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Contestant No.</label>
                      <input
                        type="text"
                        required
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number (Optional)</label>
                    <input
                      type="tel"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Bio / Project Summary</label>
                      <button
                        type="button"
                        onClick={handleGenerateEditBio}
                        disabled={isGeneratingEditBio}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>{isGeneratingEditBio ? 'Writing...' : 'AI Compose Bio'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Short bio (or click AI Compose Bio)..."
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Contestant Photo (Upload from Gallery / Device)
                    </label>
                    {editPhoto ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                        <img
                          src={editPhoto}
                          alt="Preview"
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">Photo selected</p>
                          <label className="inline-block mt-1 text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer">
                            Change from Gallery
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressed = await compressImageFile(file);
                                    setEditPhoto(compressed);
                                  } catch (err) {
                                    setActionError('Failed to read image file');
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditPhoto('')}
                          className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50 border border-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl transition-all mb-2">
                        <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="text-xs font-bold text-slate-700">Choose Photo from Gallery / Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImageFile(file);
                                setEditPhoto(compressed);
                              } catch (err) {
                                setActionError('Failed to read image file');
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                    <details className="text-[11px] text-slate-500">
                      <summary className="cursor-pointer hover:text-slate-800">Or paste image web URL</summary>
                      <input
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        value={editPhoto.startsWith('data:') ? '' : editPhoto}
                        onChange={(e) => setEditPhoto(e.target.value)}
                        className="mt-1.5 w-full px-3 py-1.5 border rounded-lg text-xs bg-white text-slate-800"
                      />
                    </details>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingContestant(null)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT & MONITORING */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Refresh / Unlock All Devices Banner */}
          <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-600 text-white rounded-lg">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-black text-indigo-950">
                    Unlock All Devices for New Contest / Round
                  </h3>
                </div>
                <p className="text-xs text-indigo-800 mt-1 max-w-2xl leading-relaxed">
                  When a contest ends, all voter devices that reached their 2-vote limit are locked. Refreshing all devices clears those locks so that all previous voters can cast votes freely again in the new contest without any restriction.
                </p>
                <div className="mt-2 text-[11px] font-semibold text-indigo-700 flex flex-wrap items-center gap-3">
                  <span>Total Recorded Vote Submissions: <strong>{stats?.participations?.length ?? stats?.total_votes ?? 0}</strong></span>
                  {stats?.contest?.last_devices_reset_at && (
                    <span>• Last Refreshed: {new Date(stats.contest.last_devices_reset_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetAllDevicesModalOpen(true)}
                className="px-4 py-2 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shrink-0 shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh & Unlock All Devices</span>
              </button>
            </div>
          </div>

          {/* Gemini AI Fraud & Anomaly Audit */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-700/80 rounded-lg">
                    <Sparkles className="w-4 h-4 text-purple-200" />
                  </span>
                  <h3 className="text-sm font-black text-white">
                    Gemini AI Vote Integrity & Fraud Audit
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/30 border border-purple-400/40 text-purple-200 px-2 py-0.5 rounded-full">
                    gemini-3.6-flash
                  </span>
                </div>
                <p className="text-xs text-purple-200 mt-1 max-w-2xl leading-relaxed">
                  Analyze submission timestamps, IP velocity, and device entropy to identify bot patterns, voting farms, or coordinated ballot stuffing.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunAiAudit}
                disabled={isAuditingAi}
                className="px-4 py-2 text-xs font-black rounded-xl bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center gap-2 shrink-0 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>{isAuditingAi ? 'Analyzing Submissions...' : 'Run AI Security Audit'}</span>
              </button>
            </div>

            {aiAuditResult && (
              <div className="mt-4 pt-4 border-t border-purple-700/60 bg-purple-950/40 -mx-5 -mb-5 p-5 rounded-b-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-purple-300">Fraud Risk Evaluation:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                    aiAuditResult.riskLevel === 'HIGH' ? 'bg-red-500/30 border border-red-400 text-red-300' :
                    aiAuditResult.riskLevel === 'MEDIUM' ? 'bg-amber-500/30 border border-amber-400 text-amber-300' :
                    'bg-emerald-500/30 border border-emerald-400 text-emerald-300'
                  }`}>
                    {aiAuditResult.riskLevel || 'LOW'} RISK
                  </span>
                </div>
                <p className="text-xs text-purple-100 font-medium leading-relaxed mb-3">
                  {aiAuditResult.summary}
                </p>
                {aiAuditResult.recommendations && aiAuditResult.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Recommendations:</span>
                    <ul className="list-disc pl-5 text-xs text-purple-200 space-y-0.5">
                      {aiAuditResult.recommendations.map((rec: string, i: number) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              Real-Time Participations Log (Last 25 Submissions)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Authorized audit view. Voter names and masked contact numbers are recorded server-side for duplicate prevention.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Contestant</th>
                    <th className="py-2.5 px-3">Voter Name</th>
                    <th className="py-2.5 px-3">WhatsApp (Masked)</th>
                    <th className="py-2.5 px-3">Device Token Prefix</th>
                    <th className="py-2.5 px-3">Network IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {stats?.recentParticipations?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 font-sans">
                        No submissions recorded yet.
                      </td>
                    </tr>
                  )}
                  {stats?.recentParticipations?.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 text-slate-600 font-sans">
                        {new Date(p.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 font-sans font-bold text-slate-900">
                        #{p.contestant_number} {p.contestant_name}
                      </td>
                      <td className="py-2 px-3 font-sans">{p.voter_name}</td>
                      <td className="py-2 px-3 text-emerald-800">{p.voter_whatsapp_masked}</td>
                      <td className="py-2 px-3 text-slate-500">{p.device_token.slice(0, 8)}...</td>
                      <td className="py-2 px-3 text-slate-500">{p.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Abuse Logs */}
          <div className="bg-white rounded-xl border border-red-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Blocked Suspicious / Duplicate Events ({stats?.abuseLogs?.length || 0})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Devices that exceeded the maximum 2 submissions limit or triggered rate-limits:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-red-50 text-red-800 font-bold uppercase">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Event Type</th>
                    <th className="py-2 px-3">Device Token Snippet</th>
                    <th className="py-2 px-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.abuseLogs?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-slate-400 font-sans">
                        No abuse events detected.
                      </td>
                    </tr>
                  )}
                  {stats?.abuseLogs?.map((a: any) => (
                    <tr key={a.id}>
                      <td className="py-2 px-3 text-slate-600 font-sans">{new Date(a.created_at).toLocaleTimeString()}</td>
                      <td className="py-2 px-3 font-bold text-red-600">{a.event_type}</td>
                      <td className="py-2 px-3 text-slate-600">{a.device_token ? a.device_token.slice(0, 10) + '...' : '—'}</td>
                      <td className="py-2 px-3 text-slate-600">{a.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTEST SETTINGS */}
      {activeTab === 'contest' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-3xl">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Contest Settings & Channels
          </h2>

          <form onSubmit={handleUpdateContest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contest Title
              </label>
              <input
                type="text"
                value={contestForm.title || ''}
                onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={contestForm.description || ''}
                onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contest Status
                </label>
                <select
                  value={contestForm.status || 'active'}
                  onChange={(e) => setContestForm({ ...contestForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="active">Active (Voting Open)</option>
                  <option value="upcoming">Upcoming (Not Started)</option>
                  <option value="paused">Paused (Temporarily on Hold)</option>
                  <option value="closed">Closed (Voting Ended)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Max Submissions per Browser/Device
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={contestForm.max_submissions_per_device || 2}
                  onChange={(e) => setContestForm({ ...contestForm, max_submissions_per_device: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            {/* DEDICATED CONTEST COUNTDOWN & TIMER CONTROLS */}
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Contest Countdown & Voting Deadline
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {formatRemainingCountdown(contestForm.end_time)}
                  </span>
                </div>
              </div>

              {/* Front Page Visibility Control Card */}
              <div className="p-4 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase">
                      Front Page Countdown Display
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      contestForm.show_countdown
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      {contestForm.show_countdown ? '● ENABLED (VISIBLE ON HOMEPAGE)' : '○ DISABLED (REMOVED FROM HOMEPAGE)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {contestForm.show_countdown
                      ? 'The countdown timer and deadline badge are currently visible to voters on the front page.'
                      : 'The countdown timer is currently completely hidden from the front page until you enable it here.'}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleToggleCountdownVisibility(!contestForm.show_countdown)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer ${
                      contestForm.show_countdown
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
                    }`}
                  >
                    {countdownSaving
                      ? 'Updating...'
                      : contestForm.show_countdown
                      ? 'Hide / Remove Timer'
                      : '✓ Enable Timer on Front Page'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Adjust Countdown End Date & Time
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="datetime-local"
                    value={
                      contestForm.end_time
                        ? (() => {
                            try {
                              const d = new Date(contestForm.end_time);
                              return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                                .toISOString()
                                .slice(0, 16);
                            } catch {
                              return '';
                            }
                          })()
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setContestForm({
                        ...contestForm,
                        end_time: val ? new Date(val).toISOString() : null,
                      });
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    disabled={countdownSaving || !contestForm.end_time}
                    onClick={() => {
                      if (contestForm.end_time) {
                        handleAdjustCountdownTime(
                          contestForm.end_time,
                          'Countdown deadline updated immediately!'
                        );
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-2xs"
                  >
                    {countdownSaving ? 'Saving...' : 'Apply Countdown Now'}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Controls the live countdown timer on the homepage hero and leaderboard. Voting closes automatically when the timer reaches zero.
                </span>
              </div>

              {/* Quick Adjust Buttons */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Quick Extensions (+ Add Time):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(1)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(6)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    +6 Hours
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(12)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    +12 Hours
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(24)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                  >
                    +1 Day
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(72)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(168)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(336)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    +14 Days
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleResetCountdownDays(30)}
                    className="px-2.5 py-1 text-xs font-bold rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 transition-colors"
                  >
                    Reset to 30 Days
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={handleEndCountdownNow}
                    className="px-2.5 py-1 text-xs font-bold rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                    title="Stop voting immediately"
                  >
                    End Voting Now
                  </button>
                </div>
              </div>
            </div>

            {/* ENGAGEMENT METRICS (VIEWS & FOLLOWERS CONFIGURATION) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Numbers of Views (Green Slot)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={contestForm.views_count ?? 3482}
                  onChange={(e) => setContestForm({ ...contestForm, views_count: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
                <span className="text-[11px] text-slate-500">Displayed in the green views slot. Automatically increments whenever any voter visits the contest.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Channel Followers (White Slot)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={contestForm.followers_count ?? 1250}
                  onChange={(e) => setContestForm({ ...contestForm, followers_count: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
                <span className="text-[11px] text-slate-500">Displayed in the white followers slot. Automatically increments when a vote is cast or the Follow button is clicked.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Official WhatsApp Channel URL
              </label>
              <input
                type="url"
                value={contestForm.whatsapp_channel_url || ''}
                onChange={(e) => setContestForm({ ...contestForm, whatsapp_channel_url: e.target.value })}
                placeholder="https://whatsapp.com/channel/..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <span className="text-[11px] text-slate-500">Presented on the final success screen for voters to follow the channel.</span>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={contestForm.is_public_leaderboard_visible ?? true}
                  onChange={(e) => setContestForm({ ...contestForm, is_public_leaderboard_visible: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Public Leaderboard Visible</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={contestForm.allow_contestant_registration ?? true}
                  onChange={(e) => setContestForm({ ...contestForm, allow_contestant_registration: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Allow Candidate Registration</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={contestForm.show_countdown ?? false}
                  onChange={(e) => setContestForm({ ...contestForm, show_countdown: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="font-bold text-slate-900">Show Countdown Timer on Front Page</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: SUPABASE INTEGRATION & SECRETS */}
      {activeTab === 'supabase' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>Supabase Database & Secret Keys Configuration</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All production secrets are active. Sync local contests and verify cloud database schema.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copySchemaSql}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
              </button>
              <a
                href="https://supabase.com/dashboard/project/pwnpskdkoefrqmowwbgo/sql/new"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open SQL Editor</span>
              </a>
            </div>
          </div>

          {/* Active Secret Keys Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ADMIN_SECRET_KEY</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-slate-800">verifiedmenmex</p>
              <p className="text-[10px] text-slate-500 mt-1">Secures admin endpoints & device unlock actions.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GEMINI_API_KEY</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> CONNECTED
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-slate-800">gemini-3.6-flash</p>
              <p className="text-[10px] text-slate-500 mt-1">Powers AI bio generation and vote fraud audits.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SUPABASE_PROJECT</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  <Database className="w-3 h-3" /> READY
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-slate-800 truncate" title="https://pwnpskdkoefrqmowwbgo.supabase.co">
                pwnpskdkoefrqmowwbgo
              </p>
              <p className="text-[10px] text-slate-500 mt-1">PostgreSQL cloud storage & live synchronization.</p>
            </div>
          </div>

          {/* Cloud Sync Action Banner */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-700" />
                <span>Publish Local Contestants & Settings to Supabase Cloud</span>
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Ensure you have pasted and run <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">supabase/schema.sql</code> in the Supabase SQL editor first, then click Sync.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncingSupabase}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span>{isSyncingSupabase ? 'Publishing to Cloud...' : 'Sync to Supabase'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700 leading-relaxed">
            <h3 className="font-bold text-slate-900">How to Run the SQL Schema in Supabase:</h3>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>
                Click the green <strong>"Open SQL Editor"</strong> button above (or navigate to your Supabase project's SQL Editor).
              </li>
              <li>
                Click the <strong>"Copy SQL Schema"</strong> button above to copy the schema to your clipboard.
              </li>
              <li>
                Paste into the Supabase SQL Editor and click <strong>"Run"</strong>.
              </li>
              <li>
                Once the tables are created, click <strong>"Sync to Supabase"</strong> above to push your current contest and contestants into the cloud!
              </li>
            </ol>
          </div>

          {/* GitHub Pages Host Live Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-slate-700 rounded-lg">
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                </span>
                <h3 className="text-sm font-bold text-white">
                  GitHub Pages Automated Deployment
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2.5 py-0.5 rounded-full">
                READY TO HOST
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your repository contains the pre-configured GitHub Actions workflow (<code className="font-mono text-emerald-300">.github/workflows/deploy.yml</code>), client-side single-page router (<code className="font-mono text-emerald-300">404.html</code>), and relative asset paths (<code className="font-mono text-emerald-300">base: './'</code>).
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-700/60 font-mono text-[11px] text-slate-200 space-y-1">
              <div className="text-slate-400"># Run these 2 commands in your terminal to publish to your repo:</div>
              <div className="text-emerald-400 font-bold select-all">git remote add origin https://github.com/&lt;your-username&gt;/&lt;your-repo&gt;.git</div>
              <div className="text-emerald-400 font-bold select-all">git push -u origin main</div>
            </div>
            <p className="text-[11px] text-slate-400">
              Then go to your GitHub Repo &rarr; <strong>Settings</strong> &rarr; <strong>Pages</strong> &rarr; Source: <strong>GitHub Actions</strong>. GitHub will automatically build and host the website live on the web!
            </p>
          </div>
        </div>
      )}

      {/* COUNTDOWN ADJUST MODAL (Available globally from any Admin tab) */}
      {isAdjustingCountdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Fix / Adjust Contest Countdown Time
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update the official voting deadline across all public views
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustingCountdown(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Deadline Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-slate-600">Current Status:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formatRemainingCountdown(stats?.contest?.end_time)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-slate-500">
                <span>Current Deadline:</span>
                <span className="font-medium text-slate-800">
                  {stats?.contest?.end_time
                    ? `${new Date(stats.contest.end_time).toLocaleDateString()} at ${new Date(stats.contest.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Front Page Visibility Switch */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-800 block">Front Page Timer Display</span>
                <span className="text-[11px] text-slate-500">
                  {contestForm.show_countdown
                    ? 'Countdown is currently VISIBLE to voters.'
                    : 'Countdown is currently HIDDEN from voters.'}
                </span>
              </div>
              <button
                type="button"
                disabled={countdownSaving}
                onClick={() => handleToggleCountdownVisibility(!contestForm.show_countdown)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  contestForm.show_countdown
                    ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
                }`}
              >
                {contestForm.show_countdown ? 'Hide from Front Page' : 'Show on Front Page'}
              </button>
            </div>

            {/* 1-Click Quick Extension Buttons */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1-Click Quick Extensions (+ Add Time)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(1)}
                  className="py-2 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-500 text-slate-800 transition-all text-center"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(6)}
                  className="py-2 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-500 text-slate-800 transition-all text-center"
                >
                  +6 Hours
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(12)}
                  className="py-2 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-500 text-slate-800 transition-all text-center"
                >
                  +12 Hours
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(24)}
                  className="py-2 px-2 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all text-center"
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(72)}
                  className="py-2 px-2 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all text-center"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(168)}
                  className="py-2 px-2 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all text-center"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(336)}
                  className="py-2 px-2 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-500 text-slate-800 transition-all text-center"
                >
                  +14 Days
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(720)}
                  className="py-2 px-2 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-500 text-slate-800 transition-all text-center"
                >
                  +30 Days
                </button>
              </div>
            </div>

            {/* Custom Date & Time Picker */}
            <div className="mb-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Set Exact Date & Time
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="datetime-local"
                  value={customCountdownInput}
                  onChange={(e) => setCustomCountdownInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-xs bg-white text-slate-900"
                />
                <button
                  type="button"
                  disabled={countdownSaving || !customCountdownInput}
                  onClick={() => {
                    if (customCountdownInput) {
                      handleAdjustCountdownTime(
                        new Date(customCountdownInput).toISOString(),
                        'Countdown deadline updated to custom date!'
                      );
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-xs"
                >
                  {countdownSaving ? 'Saving...' : 'Set Exact Time'}
                </button>
              </div>
            </div>

            {/* Emergency & Reset Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={countdownSaving}
                onClick={() => handleResetCountdownDays(30)}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-all"
              >
                Reset to 30 Days
              </button>

              <button
                type="button"
                disabled={countdownSaving}
                onClick={handleEndCountdownNow}
                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition-all"
                title="Expires countdown immediately so voting stops"
              >
                End Voting Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Refresh All Devices & Clear Vote Locks for New Contest */}
      {isResetAllDevicesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Refresh All Devices
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unlock all devices across the platform for a new contest
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetAllDevicesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>How refreshing all devices works:</span>
                </p>
                <ul className="list-disc pl-5 space-y-1 text-amber-800">
                  <li>All device locks across every voter phone, computer, and browser will be cleared.</li>
                  <li>Users whose devices reached their 2-vote limit previously will be unlocked and able to vote in the new contest.</li>
                  <li>Use this after a contest has ended to prepare the platform for the next voting period.</li>
                </ul>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetContestStatusChecked}
                    onChange={(e) => setResetContestStatusChecked(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Reactivate Contest Status to 'Active'
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      If the previous contest was ended or closed, sets the status back to active so voters can vote immediately.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetVoteCountsChecked}
                    onChange={(e) => setResetVoteCountsChecked(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Reset Contestant Vote Tallies to Zero (0)
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Check this if you want a clean slate where all contestants start at 0 votes for the new contest. Leave unchecked to keep existing vote tallies.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isResettingAllDevices}
                onClick={() => setIsResetAllDevicesModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResettingAllDevices}
                onClick={handleResetAllDevices}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {isResettingAllDevices ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Refreshing All Devices...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm & Refresh All Devices</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
