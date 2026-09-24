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
  initialContest?: Contest | null;
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
  initialContest,
}) => {
  const [secretKey, setSecretKey] = useState(
    localStorage.getItem('vd_admin_token') || 'verifiedmenmex'
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Data State
  const [activeTab, setActiveTab] = useState<'contestants' | 'contest' | 'monitoring' | 'supabase'>('contestants');
  const [stats, setStats] = useState<any>(initialContest ? { contest: initialContest } : null);
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
  const [contestForm, setContestForm] = useState<Partial<Contest>>(initialContest || {});

  useEffect(() => {
    if (initialContest && (!contestForm.title || !contestForm.id)) {
      setContestForm(prev => ({
        title: initialContest.title,
        description: initialContest.description,
        status: initialContest.status,
        max_submissions_per_device: initialContest.max_submissions_per_device,
        whatsapp_channel_url: initialContest.whatsapp_channel_url,
        whatsapp_channel_name: initialContest.whatsapp_channel_name,
        is_public_leaderboard_visible: initialContest.is_public_leaderboard_visible,
        allow_contestant_registration: initialContest.allow_contestant_registration,
        show_countdown: initialContest.show_countdown,
        end_time: initialContest.end_time,
        views_count: initialContest.views_count,
        followers_count: initialContest.followers_count,
        ...prev,
      }));
    }
  }, [initialContest]);
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
    const contestId = stats?.contest?.id || initialContest?.id || 'vd-contest-2026-voters';

    try {
      const res = await fetch(`/api/admin/contests/${contestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': secretKey,
        },
        body: JSON.stringify(contestForm),
      });

      // Synchronize through universal data service as well
      await dataService.updateContestSettings(secretKey, contestForm);

      if (res.ok) {
        setActionSuccess('Contest settings (including baseline views & followers) saved successfully.');
        loadAdminStats();
        onRefreshPublicData();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to save settings.');
      }
    } catch (e: any) {
      await dataService.updateContestSettings(secretKey, contestForm);
      setActionSuccess('Contest settings saved locally.');
      loadAdminStats();
      onRefreshPublicData();
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
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4">
        {/* Global Navigation: Back and Cancel buttons */}
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-[#151921] border border-white/10 hover:border-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#1D7BF2]" />
            <span>Back to Front Page</span>
          </button>
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white bg-[#151921] border border-white/10 hover:border-white/20 rounded-xl transition-colors cursor-pointer"
            title="Cancel and return to front page"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>

        <div className="w-full max-w-md bg-[#151921] rounded-2xl border border-white/10 shadow-2xl p-8">
          <div className="w-12 h-12 rounded-xl bg-[#1D7BF2]/10 text-[#1D7BF2] border border-[#1D7BF2]/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-center text-white mb-1 tracking-tight">
            Admin Authentication
          </h1>
          <p className="text-xs text-center text-zinc-400 mb-6">
            Enter your secure administrator secret key to manage contests and review votes.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); verifyAndLoad(secretKey); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Admin Secret Key
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter ADMIN_SECRET_KEY..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] focus:ring-1 focus:ring-[#1D7BF2] text-white placeholder-zinc-500 rounded-xl text-sm outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                Default preview key: <code className="bg-[#0C0F14] border border-white/10 px-1.5 py-0.5 rounded text-[#1D7BF2] font-mono">voters-decide-admin-2026</code>
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#1D7BF2] hover:bg-[#1565C0] text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onBackToApp}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-zinc-300 hover:text-white bg-[#0C0F14] hover:bg-[#1C232E] border border-white/10 hover:border-white/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#1D7BF2]" />
                <span>Back to Contest</span>
              </button>
              <button
                type="button"
                onClick={onBackToApp}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-zinc-400 hover:text-white bg-[#0C0F14] hover:bg-[#1C232E] border border-white/10 hover:border-white/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Universal Navigation Bar with Back button and Cancel/Close side button */}
      <div className="flex items-center justify-between bg-[#151921] border border-white/10 text-white px-4 py-3 rounded-2xl shadow-md">
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-200 hover:text-white bg-[#0C0F14] hover:bg-[#1C232E] border border-white/10 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#1D7BF2]" />
          <span>Back to Contest Front Page</span>
        </button>
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-[#0C0F14] hover:bg-[#1C232E] border border-white/10 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          title="Exit admin and return to front page"
        >
          <X className="w-4 h-4 text-zinc-400" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-[#1D7BF2]/10 border border-[#1D7BF2]/20 text-[#1D7BF2] font-black text-[11px] uppercase tracking-wider">
              Control Panel
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Voters Decide Administration
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Active contest: <strong className="text-white font-bold">{stats?.contest?.title || 'Voters Decide Official Contest'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadAdminStats()}
            disabled={isLoadingStats}
            className="p-2.5 border border-white/10 bg-[#151921] hover:bg-[#1C232E] text-zinc-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="admin-adjust-countdown-btn"
            onClick={openCountdownAdjustModal}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1D7BF2] hover:bg-[#1565C0] text-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Fix or adjust the contest countdown deadline"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Adjust Countdown</span>
          </button>

          <button
            id="admin-refresh-all-devices-btn"
            type="button"
            onClick={() => setIsResetAllDevicesModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Refresh and unlock all devices that voted before so they can participate in the new contest"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh All Devices</span>
          </button>

          <button
            onClick={handleResetCurrentDevice}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Clear participations for your current browser to test 2-vote limit again"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Reset My Test Device (2 Votes)</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-white/10 bg-[#151921] hover:bg-[#1C232E] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign Out
          </button>

          <button
            onClick={onBackToApp}
            className="px-3.5 py-2 text-xs font-black rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer shadow-md"
          >
            View Public Contest
          </button>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center justify-between">
          <span className="font-semibold">{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold px-1 cursor-pointer">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center justify-between">
          <span className="font-semibold">{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white font-bold px-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#151921] p-4.5 rounded-2xl border border-white/10 shadow-lg">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Total Votes</span>
          <div className="text-2xl font-black text-white mt-1 tabular-nums">
            {stats?.totalVotes?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-[#151921] p-4.5 rounded-2xl border border-white/10 shadow-lg">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Submissions</span>
          <div className="text-2xl font-black text-white mt-1 tabular-nums">
            {stats?.totalSubmissions || 0}
          </div>
        </div>

        <div className="bg-[#151921] p-4.5 rounded-2xl border border-emerald-500/25 shadow-lg bg-gradient-to-br from-[#151921] to-[#12231E]">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Site Views</span>
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
            {(stats?.contest?.views_count ?? 3482).toLocaleString()}
          </div>
        </div>

        <div className="bg-[#151921] p-4.5 rounded-2xl border border-amber-500/25 shadow-lg bg-gradient-to-br from-[#151921] to-[#252014]">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Followers</span>
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1 tabular-nums">
            {(stats?.contest?.followers_count ?? 1250).toLocaleString()}
          </div>
        </div>

        <div className="bg-[#151921] p-4.5 rounded-2xl border border-white/10 shadow-lg">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Applications</span>
          <div className="text-2xl font-black text-amber-400 mt-1 tabular-nums">
            {stats?.pendingCandidates || 0}
          </div>
        </div>

        <div className="bg-[#151921] p-4.5 rounded-2xl border border-white/10 shadow-lg">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Abuse Prevented</span>
          <div className="text-2xl font-black text-red-400 mt-1 tabular-nums">
            {stats?.abuseLogs?.length || 0}
          </div>
        </div>

        {/* Live Contest Countdown Status Banner */}
        <div className="bg-[#151921] p-5 rounded-2xl border border-[#1D7BF2]/30 shadow-xl col-span-2 sm:col-span-3 lg:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#151921] via-[#141C28] to-[#151921]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#1D7BF2]/10 text-[#1D7BF2] border border-[#1D7BF2]/25 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Official Voting Countdown Status
              </span>
              <div className="text-sm sm:text-base font-extrabold text-white flex flex-wrap items-center gap-2.5 mt-0.5">
                <span className="text-[#1D7BF2] font-mono font-black text-base">
                  {formatRemainingCountdown(stats?.contest?.end_time)}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  contestForm.show_countdown
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-white/10'
                }`}>
                  {contestForm.show_countdown ? '● Front Page: VISIBLE' : '○ Front Page: HIDDEN'}
                </span>
                {stats?.contest?.end_time && (
                  <span className="text-xs font-medium text-zinc-400">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                contestForm.show_countdown
                  ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
                  : 'bg-[#1D7BF2] hover:bg-[#1565C0] text-white'
              }`}
              title={contestForm.show_countdown ? 'Hide countdown from the front page' : 'Enable countdown on the front page'}
            >
              {countdownSaving ? 'Saving...' : contestForm.show_countdown ? 'Hide from Front Page' : 'Enable on Front Page'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickExtendHours(24)}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#0C0F14] hover:bg-[#1C232E] text-zinc-300 text-xs font-bold transition-all cursor-pointer"
              title="Add 1 Day to current deadline"
            >
              +1 Day
            </button>
            <button
              type="button"
              onClick={() => handleQuickExtendHours(72)}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#0C0F14] hover:bg-[#1C232E] text-zinc-300 text-xs font-bold transition-all cursor-pointer"
              title="Add 3 Days to current deadline"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={openCountdownAdjustModal}
              className="px-3 py-1.5 rounded-xl bg-[#1D7BF2] hover:bg-[#1565C0] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Fix / Adjust Timer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-white/10 mt-8 mb-6 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('contestants')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'contestants'
              ? 'border-[#1D7BF2] text-[#1D7BF2]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contestants Management ({stats?.contestants?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'monitoring'
              ? 'border-[#1D7BF2] text-[#1D7BF2]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Anti-Abuse & Vote Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('contest')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'contest'
              ? 'border-[#1D7BF2] text-[#1D7BF2]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Contest Settings & Channels</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'supabase'
              ? 'border-[#1D7BF2] text-[#1D7BF2]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-[#1D7BF2]" />
          <span>Supabase Integration</span>
        </button>
      </div>

      {/* TAB 1: CONTESTANTS MANAGEMENT */}
      {activeTab === 'contestants' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Contestants Directory
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage registered candidates, approve or reject applications, and update details.
              </p>
            </div>
            <button
              onClick={() => setIsAddingContestant(!isAddingContestant)}
              className="px-4 py-2 rounded-xl bg-[#1D7BF2] hover:bg-[#1565C0] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAddingContestant ? 'Close Form' : 'Add Contestant'}</span>
            </button>
          </div>

          {/* Add Contestant Form */}
          {isAddingContestant && (
            <div className="bg-[#151921] p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Add Official Contestant</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Enter ballot profile information and candidate photo.</p>
              </div>
              <form onSubmit={handleAddContestant} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Contestant Number (e.g. 05)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white placeholder-zinc-500 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Candidate Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white placeholder-zinc-500 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white placeholder-zinc-500 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Bio / Project Summary</label>
                    <button
                      type="button"
                      onClick={handleGenerateNewBio}
                      disabled={isGeneratingNewBio}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D7BF2] bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 border border-[#1D7BF2]/30 px-3 py-1 rounded-full transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGeneratingNewBio ? 'Writing...' : 'AI Compose Bio'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Short description of candidate (or click AI Compose Bio)"
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white placeholder-zinc-500 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Contestant Photo (Upload from Gallery or Device)
                  </label>
                  <div className="space-y-3">
                    {newPhoto ? (
                      <div className="flex items-center gap-3 p-3 bg-[#0C0F14] border border-white/15 rounded-xl">
                        <img
                          src={newPhoto}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">Photo selected from gallery/device</p>
                          <p className="text-[11px] text-emerald-400 font-medium">Ready to save with contestant</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPhoto('')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1 border border-red-500/30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-[#1D7BF2] hover:bg-[#1D7BF2]/5 rounded-2xl transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-[#1D7BF2]/10 text-[#1D7BF2] border border-[#1D7BF2]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-white">
                          Choose Photo from Gallery / Camera Roll
                        </span>
                        <span className="text-[11px] text-zinc-400 mt-1">
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
                    <details className="text-[11px] text-zinc-400">
                      <summary className="cursor-pointer hover:text-white font-medium">
                        Or enter image web URL manually
                      </summary>
                      <input
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        value={newPhoto.startsWith('data:') ? '' : newPhoto}
                        onChange={(e) => setNewPhoto(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-xs outline-none"
                      />
                    </details>
                  </div>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingContestant(false)}
                    className="px-4 py-2 border border-white/15 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1D7BF2] hover:bg-[#1565C0] text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all"
                  >
                    Save &amp; Approve
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Contestants Table */}
          <div className="bg-[#151921] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-[#0C0F14] border-b border-white/10 text-zinc-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">No.</th>
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Votes</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(!stats?.contestants || stats.contestants.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-zinc-500 font-medium">
                        No contestants added yet. Click &quot;Add Contestant&quot; above to create one.
                      </td>
                    </tr>
                  ) : (
                    stats.contestants.map((c: Contestant) => (
                      <tr key={c.id} className="hover:bg-[#1C232E]/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          #{c.contestant_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {c.photo_url ? (
                              <img
                                src={c.photo_url}
                                alt={c.name}
                                className="w-9 h-9 rounded-xl object-cover border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-[#1D7BF2]/15 text-[#1D7BF2] font-black flex items-center justify-center text-xs">
                                {c.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white">{c.name}</div>
                              <div className="text-[11px] text-zinc-400 line-clamp-1 max-w-xs">{c.bio || 'No bio provided'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-300">
                          {c.whatsapp_number || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-black tabular-nums text-white text-sm">
                          {c.vote_count.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            c.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            c.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            c.status === 'disabled' ? 'bg-zinc-800 text-zinc-400 border border-white/10' :
                            'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleStartEditContestant(c)}
                            className="px-2.5 py-1.5 bg-[#0C0F14] hover:bg-[#1C232E] text-zinc-300 hover:text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                            title="Edit candidate details or change photo"
                          >
                            <Edit2 className="w-3 h-3 text-[#1D7BF2]" />
                            <span>Edit</span>
                          </button>
                          {c.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'approved')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {c.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'disabled')}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold text-[11px] border border-white/10 cursor-pointer transition-colors"
                            >
                              Disable
                            </button>
                          )}
                          {c.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'rejected')}
                              className="px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg font-semibold text-[11px] border border-red-500/30 cursor-pointer transition-colors"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteContestant(c.id, c.name)}
                            className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-semibold text-[11px] border border-red-500/25 transition-colors cursor-pointer"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
              <div className="bg-[#151921] rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-white/15 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden">
                <div className="shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#1D7BF2]/10 text-[#1D7BF2] border border-[#1D7BF2]/20">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        Edit Contestant &amp; Photo
                      </h3>
                      <p className="text-xs text-zinc-400">Update ballot details or swap candidate photo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingContestant(null)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                      title="Back to contestants list"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingContestant(null)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer"
                      title="Cancel and close"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveEditContestant} className="flex-1 overflow-y-auto overscroll-contain space-y-4 pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Contestant No.</label>
                      <input
                        type="text"
                        required
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-xs font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">WhatsApp Number (Optional)</label>
                    <input
                      type="tel"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full px-3.5 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Bio / Project Summary</label>
                      <button
                        type="button"
                        onClick={handleGenerateEditBio}
                        disabled={isGeneratingEditBio}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D7BF2] bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 border border-[#1D7BF2]/30 px-3 py-1 rounded-full transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isGeneratingEditBio ? 'Writing...' : 'AI Compose Bio'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Short bio (or click AI Compose Bio)..."
                      className="w-full px-3.5 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-xs outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      Contestant Photo (Upload from Gallery / Device)
                    </label>
                    {editPhoto ? (
                      <div className="flex items-center gap-3 p-3 bg-[#0C0F14] border border-white/15 rounded-xl mb-2">
                        <img
                          src={editPhoto}
                          alt="Preview"
                          className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">Photo selected</p>
                          <label className="inline-block mt-1 text-xs text-[#1D7BF2] font-bold hover:underline cursor-pointer">
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
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/25 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center p-5 border-2 border-dashed border-white/20 hover:border-[#1D7BF2] hover:bg-[#1D7BF2]/5 rounded-xl transition-all mb-2 group">
                        <Camera className="w-5 h-5 text-[#1D7BF2] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-white">Choose Photo from Gallery / Device</span>
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
                    <details className="text-[11px] text-zinc-400">
                      <summary className="cursor-pointer hover:text-white">Or paste image web URL</summary>
                      <input
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        value={editPhoto.startsWith('data:') ? '' : editPhoto}
                        onChange={(e) => setEditPhoto(e.target.value)}
                        className="mt-1.5 w-full px-3 py-2 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-xs outline-none"
                      />
                    </details>
                  </div>

                  <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingContestant(null)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 border border-white/15 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingContestant(null)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 border border-white/15 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#1D7BF2] hover:bg-[#1565C0] text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all"
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
          <div className="bg-[#151921] border border-indigo-500/30 rounded-2xl p-6 shadow-xl bg-gradient-to-r from-[#151921] via-[#161B2E] to-[#151921]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-black text-white">
                    Unlock All Devices for New Contest / Round
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 mt-1.5 max-w-2xl leading-relaxed">
                  When a contest ends, all voter devices that reached their 2-vote limit are locked. Refreshing all devices clears those locks so that all previous voters can cast votes freely again in the new contest without any restriction.
                </p>
                <div className="mt-3 text-xs font-semibold text-indigo-300 flex flex-wrap items-center gap-3">
                  <span>Total Recorded Vote Submissions: <strong className="text-white font-mono">{stats?.participations?.length ?? stats?.total_votes ?? 0}</strong></span>
                  {stats?.contest?.last_devices_reset_at && (
                    <span className="text-zinc-400">• Last Refreshed: {new Date(stats.contest.last_devices_reset_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetAllDevicesModalOpen(true)}
                className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shrink-0 shadow-lg transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh &amp; Unlock All Devices</span>
              </button>
            </div>
          </div>

          {/* Gemini AI Fraud & Anomaly Audit */}
          <div className="bg-gradient-to-r from-[#171426] via-[#1B1832] to-[#151921] border border-purple-500/30 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-black text-white">
                    Gemini AI Vote Integrity &amp; Fraud Audit
                  </h3>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2.5 py-0.5 rounded-full">
                    gemini-3.8-flash
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1.5 max-w-2xl leading-relaxed">
                  Analyze submission timestamps, IP velocity, and device entropy to identify bot patterns, voting farms, or coordinated ballot stuffing.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunAiAudit}
                disabled={isAuditingAi}
                className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shrink-0 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>{isAuditingAi ? 'Analyzing Submissions...' : 'Run AI Security Audit'}</span>
              </button>
            </div>

            {aiAuditResult && (
              <div className="mt-5 pt-5 border-t border-purple-500/30 bg-[#12101F]/80 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-xs font-bold text-purple-200">Fraud Risk Evaluation:</span>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    aiAuditResult.riskLevel === 'HIGH' ? 'bg-red-500/25 border border-red-500/40 text-red-300' :
                    aiAuditResult.riskLevel === 'MEDIUM' ? 'bg-amber-500/25 border border-amber-500/40 text-amber-300' :
                    'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300'
                  }`}>
                    {aiAuditResult.riskLevel || 'LOW'} RISK
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-medium leading-relaxed mb-3">
                  {aiAuditResult.summary}
                </p>
                {aiAuditResult.recommendations && aiAuditResult.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Recommendations:</span>
                    <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1">
                      {aiAuditResult.recommendations.map((rec: string, i: number) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#151921] rounded-2xl border border-white/10 p-6 shadow-xl">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-1">
              Real-Time Participations Log (Last 25 Submissions)
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              Authorized audit view. Voter names and masked contact numbers are recorded server-side for duplicate prevention.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C0F14] border-b border-white/10 text-zinc-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Timestamp</th>
                    <th className="py-3 px-3.5">Contestant</th>
                    <th className="py-3 px-3.5">Voter Name</th>
                    <th className="py-3 px-3.5">WhatsApp (Masked)</th>
                    <th className="py-3 px-3.5">Device Token Prefix</th>
                    <th className="py-3 px-3.5">Network IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {stats?.recentParticipations?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 font-sans">
                        No submissions recorded yet.
                      </td>
                    </tr>
                  )}
                  {stats?.recentParticipations?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[#1C232E]/30 transition-colors">
                      <td className="py-3 px-3.5 text-zinc-400 font-sans">
                        {new Date(p.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3.5 font-sans font-bold text-white">
                        #{p.contestant_number} {p.contestant_name}
                      </td>
                      <td className="py-3 px-3.5 font-sans text-zinc-200">{p.voter_name}</td>
                      <td className="py-3 px-3.5 text-emerald-400 font-bold">{p.voter_whatsapp_masked}</td>
                      <td className="py-3 px-3.5 text-zinc-400">{p.device_token.slice(0, 8)}...</td>
                      <td className="py-3 px-3.5 text-zinc-400">{p.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Abuse Logs */}
          <div className="bg-[#151921] rounded-2xl border border-red-500/30 p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Blocked Suspicious / Duplicate Events ({stats?.abuseLogs?.length || 0})
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Devices that exceeded the maximum 2 submissions limit or triggered rate-limits:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0C0F14] border-b border-red-500/20 text-red-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Timestamp</th>
                    <th className="py-3 px-3.5">Event Type</th>
                    <th className="py-3 px-3.5">Device Token Snippet</th>
                    <th className="py-3 px-3.5">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats?.abuseLogs?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-500 font-sans">
                        No abuse events detected.
                      </td>
                    </tr>
                  )}
                  {stats?.abuseLogs?.map((a: any) => (
                    <tr key={a.id} className="hover:bg-red-500/5 transition-colors">
                      <td className="py-3 px-3.5 text-zinc-400 font-sans">{new Date(a.created_at).toLocaleTimeString()}</td>
                      <td className="py-3 px-3.5 font-bold text-red-400">{a.event_type}</td>
                      <td className="py-3 px-3.5 text-zinc-400">{a.device_token ? a.device_token.slice(0, 10) + '...' : '—'}</td>
                      <td className="py-3 px-3.5 text-zinc-400">{a.ip_address}</td>
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
        <div className="bg-[#151921] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl max-w-3xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-[#1D7BF2]" />
              <span>Contest Settings &amp; Channels</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Configure official election parameters, ballot title, voting limits, countdown timers, and channel integrations.
            </p>
          </div>

          <form onSubmit={handleUpdateContest} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Contest Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={contestForm.title ?? ''}
                placeholder="e.g. Voters Decide — Official 2026 Election"
                onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] focus:ring-1 focus:ring-[#1D7BF2] text-white placeholder-zinc-500 rounded-xl text-sm font-semibold transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Contest Description / Instructions
              </label>
              <textarea
                rows={3}
                value={contestForm.description ?? ''}
                placeholder="Official contest description displayed on the homepage and ballot..."
                onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
                className="w-full px-4 py-3 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] focus:ring-1 focus:ring-[#1D7BF2] text-white placeholder-zinc-500 rounded-xl text-sm transition-all outline-none resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Contest Status
                </label>
                <select
                  value={contestForm.status || 'active'}
                  onChange={(e) => setContestForm({ ...contestForm, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] focus:ring-1 focus:ring-[#1D7BF2] text-white rounded-xl text-sm font-semibold transition-all outline-none cursor-pointer"
                >
                  <option className="bg-[#151921] text-white" value="active">Active (Voting Open)</option>
                  <option className="bg-[#151921] text-white" value="upcoming">Upcoming (Not Started)</option>
                  <option className="bg-[#151921] text-white" value="paused">Paused (Temporarily on Hold)</option>
                  <option className="bg-[#151921] text-white" value="closed">Closed (Voting Ended)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Max Submissions per Browser/Device
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={contestForm.max_submissions_per_device ?? 2}
                  onChange={(e) => setContestForm({ ...contestForm, max_submissions_per_device: parseInt(e.target.value, 10) })}
                  className="w-full px-4 py-3 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] focus:ring-1 focus:ring-[#1D7BF2] text-white rounded-xl text-sm font-semibold transition-all outline-none"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">Default: 2 votes per verified device fingerprint.</span>
              </div>
            </div>

            {/* DEDICATED CONTEST COUNTDOWN & TIMER CONTROLS */}
            <div className="p-5 rounded-xl border border-white/10 bg-[#10141B] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#1D7BF2]/10 text-[#1D7BF2]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white uppercase tracking-wider block">
                      Contest Countdown &amp; Voting Deadline
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Synchronized across all voter browsers in real time
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {formatRemainingCountdown(contestForm.end_time)}
                  </span>
                </div>
              </div>

              {/* Front Page Visibility Control Card */}
              <div className="p-4 rounded-xl border border-white/10 bg-[#151921] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-white uppercase tracking-wide">
                      Front Page Countdown Display
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-0.5 rounded-full ${
                      contestForm.show_countdown
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-white/10'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${contestForm.show_countdown ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                      <span>{contestForm.show_countdown ? 'VISIBLE ON HOMEPAGE' : 'HIDDEN FROM HOMEPAGE'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {contestForm.show_countdown
                      ? 'The countdown timer and deadline badge are currently visible to voters on the front page.'
                      : 'The countdown timer is currently hidden from voters until enabled.'}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleToggleCountdownVisibility(!contestForm.show_countdown)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      contestForm.show_countdown
                        ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
                        : 'bg-[#1D7BF2] hover:bg-[#1565C0] text-white shadow-md'
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
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Adjust Countdown End Date &amp; Time
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
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
                    className="flex-1 px-4 py-2.5 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-sm font-mono outline-none scheme-dark"
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
                    className="px-5 py-2.5 bg-[#1D7BF2] hover:bg-[#1565C0] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all whitespace-nowrap shadow-md cursor-pointer"
                  >
                    {countdownSaving ? 'Saving...' : 'Apply Countdown Now'}
                  </button>
                </div>
                <span className="text-[11px] text-zinc-400 mt-1.5 block">
                  Controls the live countdown timer on the homepage hero and leaderboard. Voting closes automatically when the timer reaches zero.
                </span>
              </div>

              {/* Quick Adjust Buttons */}
              <div className="pt-3 border-t border-white/10">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2.5">
                  Quick Extensions (+ Add Time):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(1)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 bg-[#151921] hover:bg-[#1D2533] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(6)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 bg-[#151921] hover:bg-[#1D2533] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    +6 Hours
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(12)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 bg-[#151921] hover:bg-[#1D2533] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    +12 Hours
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(24)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#1D7BF2]/40 bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 text-[#1D7BF2] transition-colors cursor-pointer"
                  >
                    +1 Day
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(72)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#1D7BF2]/40 bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 text-[#1D7BF2] transition-colors cursor-pointer"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(168)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#1D7BF2]/40 bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 text-[#1D7BF2] transition-colors cursor-pointer"
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleQuickExtendHours(336)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-white/10 bg-[#151921] hover:bg-[#1D2533] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    +14 Days
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={() => handleResetCountdownDays(30)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer"
                  >
                    Reset to 30 Days
                  </button>
                  <button
                    type="button"
                    disabled={countdownSaving}
                    onClick={handleEndCountdownNow}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    title="Stop voting immediately"
                  >
                    End Voting Now
                  </button>
                </div>
              </div>
            </div>

            {/* ENGAGEMENT METRICS (VIEWS & FOLLOWERS CONFIGURATION) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-white/10 bg-[#10141B]">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Website Views (Header Metric)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={contestForm.views_count ?? 3482}
                  onChange={(e) => setContestForm({ ...contestForm, views_count: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-3 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-sm font-semibold tabular-nums outline-none"
                />
                <span className="text-[11px] text-zinc-400 mt-1.5 block">Displayed in the header views badge. Automatically increments when voters browse the ballot.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Channel Followers (Header Metric)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={contestForm.followers_count ?? 1250}
                  onChange={(e) => setContestForm({ ...contestForm, followers_count: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-3 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-sm font-semibold tabular-nums outline-none"
                />
                <span className="text-[11px] text-zinc-400 mt-1.5 block">Displayed in the header followers badge. Automatically increments when voters click Follow or vote.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Official WhatsApp Channel URL
              </label>
              <input
                type="url"
                value={contestForm.whatsapp_channel_url || ''}
                onChange={(e) => setContestForm({ ...contestForm, whatsapp_channel_url: e.target.value })}
                placeholder="https://whatsapp.com/channel/..."
                className="w-full px-4 py-3 bg-[#0C0F14] border border-white/15 focus:border-[#1D7BF2] text-white placeholder-zinc-500 rounded-xl text-sm outline-none"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">Presented on the final success screen for voters to follow your official channel.</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={contestForm.is_public_leaderboard_visible ?? true}
                  onChange={(e) => setContestForm({ ...contestForm, is_public_leaderboard_visible: e.target.checked })}
                  className="w-4 h-4 text-[#1D7BF2] rounded bg-[#0C0F14] border-white/20"
                />
                <span>Public Leaderboard Visible</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={contestForm.allow_contestant_registration ?? true}
                  onChange={(e) => setContestForm({ ...contestForm, allow_contestant_registration: e.target.checked })}
                  className="w-4 h-4 text-[#1D7BF2] rounded bg-[#0C0F14] border-white/20"
                />
                <span>Allow Candidate Registration</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={contestForm.show_countdown ?? false}
                  onChange={(e) => setContestForm({ ...contestForm, show_countdown: e.target.checked })}
                  className="w-4 h-4 text-[#1D7BF2] rounded bg-[#0C0F14] border-white/20"
                />
                <span className="font-bold text-white">Show Countdown Timer on Front Page</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-7 py-3 bg-[#1D7BF2] hover:bg-[#1565C0] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Save Contest Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: SUPABASE INTEGRATION & SECRETS */}
      {activeTab === 'supabase' && (
        <div className="bg-[#151921] rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl max-w-4xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#1D7BF2]" />
                <span>Supabase Database &amp; Secret Keys Configuration</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                All production secrets are active. Sync local contests and verify cloud database schema.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copySchemaSql}
                className="px-3.5 py-2 rounded-xl border border-white/15 bg-[#0C0F14] hover:bg-white/5 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
              </button>
              <a
                href="https://supabase.com/dashboard/project/pwnpskdkoefrqmowwbgo/sql/new"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#1D7BF2] hover:bg-[#1565C0] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open SQL Editor</span>
              </a>
            </div>
          </div>

          {/* Active Secret Keys Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-white/10 bg-[#0C0F14]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ADMIN_SECRET_KEY</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-white">verifiedmenmex</p>
              <p className="text-[11px] text-zinc-400 mt-1">Secures admin endpoints &amp; device unlock actions.</p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-[#0C0F14]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">GEMINI_API_KEY</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> CONNECTED
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-white">gemini-3.8-flash</p>
              <p className="text-[11px] text-zinc-400 mt-1">Powers AI bio generation and vote fraud audits.</p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-[#0C0F14]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">SUPABASE_PROJECT</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#1D7BF2] bg-[#1D7BF2]/10 border border-[#1D7BF2]/25 px-2 py-0.5 rounded-full">
                  <Database className="w-3 h-3" /> READY
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-white truncate" title="https://pwnpskdkoefrqmowwbgo.supabase.co">
                pwnpskdkoefrqmowwbgo
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">PostgreSQL cloud storage &amp; live synchronization.</p>
            </div>
          </div>

          {/* Cloud Sync Action Banner */}
          <div className="p-5 rounded-2xl bg-[#0C0F14] border border-[#1D7BF2]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <Zap className="w-4 h-4 text-[#1D7BF2]" />
                <span>Publish Local Contestants &amp; Settings to Supabase Cloud</span>
              </h3>
              <p className="text-xs text-zinc-300 mt-1">
                Ensure you have pasted and run <code className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white">supabase/schema.sql</code> in the Supabase SQL editor first, then click Sync.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncingSupabase}
              className="px-5 py-2.5 bg-[#1D7BF2] hover:bg-[#1565C0] text-white font-extrabold text-xs rounded-xl shadow-md shrink-0 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span>{isSyncingSupabase ? 'Publishing to Cloud...' : 'Sync to Supabase'}</span>
            </button>
          </div>

          <div className="p-5 rounded-xl bg-[#0C0F14] border border-white/10 space-y-3 text-xs text-zinc-300 leading-relaxed">
            <h3 className="font-bold text-white uppercase tracking-wider">How to Run the SQL Schema in Supabase:</h3>
            <ol className="list-decimal pl-4 space-y-1.5 text-zinc-300">
              <li>
                Click the blue <strong className="text-white">&quot;Open SQL Editor&quot;</strong> button above (or navigate to your Supabase project&apos;s SQL Editor).
              </li>
              <li>
                Click the <strong className="text-white">&quot;Copy SQL Schema&quot;</strong> button above to copy the schema to your clipboard.
              </li>
              <li>
                Paste into the Supabase SQL Editor and click <strong className="text-white">&quot;Run&quot;</strong>.
              </li>
              <li>
                Once the tables are created, click <strong className="text-white">&quot;Sync to Supabase&quot;</strong> above to push your current contest and contestants into the cloud!
              </li>
            </ol>
          </div>

          {/* GitHub Pages Host Live Section */}
          <div className="p-6 rounded-2xl bg-[#0C0F14] border border-white/10 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-white/5 border border-white/10 rounded-xl">
                  <ExternalLink className="w-4 h-4 text-[#1D7BF2]" />
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  GitHub Pages Automated Deployment
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full">
                READY TO HOST
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your repository contains the pre-configured GitHub Actions workflow (<code className="font-mono text-[#1D7BF2]">.github/workflows/deploy.yml</code>), client-side single-page router (<code className="font-mono text-[#1D7BF2]">404.html</code>), and relative asset paths (<code className="font-mono text-[#1D7BF2]">base: &apos;./&apos;</code>).
            </p>
            <div className="bg-[#151921] p-3.5 rounded-xl border border-white/10 font-mono text-[11px] text-zinc-300 space-y-1">
              <div className="text-zinc-500"># Run these 2 commands in your terminal to publish to your repo:</div>
              <div className="text-[#1D7BF2] font-bold select-all">git remote add origin https://github.com/&lt;your-username&gt;/&lt;your-repo&gt;.git</div>
              <div className="text-[#1D7BF2] font-bold select-all">git push -u origin main</div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Then go to your GitHub Repo &rarr; <strong className="text-white">Settings</strong> &rarr; <strong className="text-white">Pages</strong> &rarr; Source: <strong className="text-white">GitHub Actions</strong>. GitHub will automatically build and host the website live on the web!
            </p>
          </div>
        </div>
      )}

      {/* COUNTDOWN ADJUST MODAL (Available globally from any Admin tab) */}
      {isAdjustingCountdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
          <div className="bg-[#151921] rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-white/15 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden text-left">
            <div className="shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1D7BF2]/10 text-[#1D7BF2] border border-[#1D7BF2]/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Fix / Adjust Contest Countdown Time
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Update the official voting deadline across all public views
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustingCountdown(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                  title="Back to dashboard"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdjustingCountdown(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
              {/* Current Deadline Status */}
              <div className="p-4 rounded-xl bg-[#0C0F14] border border-white/10 mb-4 text-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-zinc-400">Current Status:</span>
                <span className="font-mono font-bold text-[#1D7BF2] bg-[#1D7BF2]/10 px-2.5 py-0.5 rounded-full border border-[#1D7BF2]/25">
                  {formatRemainingCountdown(stats?.contest?.end_time)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-zinc-400">
                <span>Current Deadline:</span>
                <span className="font-medium text-white">
                  {stats?.contest?.end_time
                    ? `${new Date(stats.contest.end_time).toLocaleDateString()} at ${new Date(stats.contest.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Front Page Visibility Switch */}
            <div className="p-4 rounded-xl bg-[#0C0F14] border border-white/10 mb-4 text-xs flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white block">Front Page Timer Display</span>
                <span className="text-[11px] text-zinc-400">
                  {contestForm.show_countdown
                    ? 'Countdown is currently VISIBLE to voters.'
                    : 'Countdown is currently HIDDEN from voters.'}
                </span>
              </div>
              <button
                type="button"
                disabled={countdownSaving}
                onClick={() => handleToggleCountdownVisibility(!contestForm.show_countdown)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  contestForm.show_countdown
                    ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
                    : 'bg-[#1D7BF2] hover:bg-[#1565C0] text-white shadow-md'
                }`}
              >
                {contestForm.show_countdown ? 'Hide from Front Page' : 'Show on Front Page'}
              </button>
            </div>

            {/* 1-Click Quick Extension Buttons */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                1-Click Quick Extensions (+ Add Time)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(1)}
                  className="py-2 px-2 text-xs font-semibold rounded-xl border border-white/10 bg-[#0C0F14] hover:bg-white/5 hover:border-[#1D7BF2] text-zinc-300 hover:text-white transition-all text-center cursor-pointer"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(6)}
                  className="py-2 px-2 text-xs font-semibold rounded-xl border border-white/10 bg-[#0C0F14] hover:bg-white/5 hover:border-[#1D7BF2] text-zinc-300 hover:text-white transition-all text-center cursor-pointer"
                >
                  +6 Hours
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(12)}
                  className="py-2 px-2 text-xs font-semibold rounded-xl border border-white/10 bg-[#0C0F14] hover:bg-white/5 hover:border-[#1D7BF2] text-zinc-300 hover:text-white transition-all text-center cursor-pointer"
                >
                  +12 Hours
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(24)}
                  className="py-2 px-2 text-xs font-bold rounded-xl border border-[#1D7BF2]/30 bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 text-[#1D7BF2] transition-all text-center cursor-pointer"
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(72)}
                  className="py-2 px-2 text-xs font-bold rounded-xl border border-[#1D7BF2]/30 bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 text-[#1D7BF2] transition-all text-center cursor-pointer"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(168)}
                  className="py-2 px-2 text-xs font-bold rounded-xl border border-[#1D7BF2]/30 bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 text-[#1D7BF2] transition-all text-center cursor-pointer"
                >
                  +7 Days
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(336)}
                  className="py-2 px-2 text-xs font-bold rounded-xl border border-white/10 bg-[#0C0F14] hover:bg-white/5 hover:border-[#1D7BF2] text-zinc-300 hover:text-white transition-all text-center cursor-pointer"
                >
                  +14 Days
                </button>
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleQuickExtendHours(720)}
                  className="py-2 px-2 text-xs font-bold rounded-xl border border-white/10 bg-[#0C0F14] hover:bg-white/5 hover:border-[#1D7BF2] text-zinc-300 hover:text-white transition-all text-center cursor-pointer"
                >
                  +30 Days
                </button>
              </div>
            </div>

            {/* Custom Date & Time Picker */}
            <div className="mb-4 p-4 rounded-xl border border-white/10 bg-[#0C0F14]">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Set Exact Date &amp; Time
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="datetime-local"
                  value={customCountdownInput}
                  onChange={(e) => setCustomCountdownInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-[#151921] border border-white/15 focus:border-[#1D7BF2] text-white rounded-xl text-xs outline-none"
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
                  className="px-5 py-2.5 bg-[#1D7BF2] hover:bg-[#1565C0] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all whitespace-nowrap shadow-md cursor-pointer"
                >
                  {countdownSaving ? 'Saving...' : 'Set Exact Time'}
                </button>
              </div>
            </div>

            {/* Emergency, Reset, Back & Cancel Actions */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 mt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={() => handleResetCountdownDays(30)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-[#1D7BF2]/30 text-[#1D7BF2] bg-[#1D7BF2]/10 hover:bg-[#1D7BF2]/20 text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Reset 30 Days
                </button>

                <button
                  type="button"
                  disabled={countdownSaving}
                  onClick={handleEndCountdownNow}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold transition-all cursor-pointer text-center"
                  title="Expires countdown immediately so voting stops"
                >
                  End Voting Now
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsAdjustingCountdown(false)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdjustingCountdown(false)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Refresh All Devices & Clear Vote Locks for New Contest */}
      {isResetAllDevicesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
          <div className="bg-[#151921] rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-white/15 flex flex-col max-h-[calc(100dvh-1.25rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto overflow-hidden">
            <div className="shrink-0 flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Refresh All Devices
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Unlock all devices across the platform for a new contest
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetAllDevicesModalOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                  title="Back to dashboard"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetAllDevicesModalOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain py-3.5 space-y-4 pr-1">
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-200 text-xs leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1.5 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>How refreshing all devices works:</span>
                </p>
                <ul className="list-disc pl-5 space-y-1 text-amber-200/90">
                  <li>All device locks across every voter phone, computer, and browser will be cleared.</li>
                  <li>Users whose devices reached their 2-vote limit previously will be unlocked and able to vote in the new contest.</li>
                  <li>Use this after a contest has ended to prepare the platform for the next voting period.</li>
                </ul>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 bg-[#0C0F14] cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetContestStatusChecked}
                    onChange={(e) => setResetContestStatusChecked(e.target.checked)}
                    className="mt-0.5 rounded text-[#1D7BF2] bg-[#151921] border-white/20"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white">
                      Reactivate Contest Status to &apos;Active&apos;
                    </span>
                    <span className="block text-[11px] text-zinc-400 mt-0.5">
                      If the previous contest was ended or closed, sets the status back to active so voters can vote immediately.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 bg-[#0C0F14] cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetVoteCountsChecked}
                    onChange={(e) => setResetVoteCountsChecked(e.target.checked)}
                    className="mt-0.5 rounded text-[#1D7BF2] bg-[#151921] border-white/20"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white">
                      Reset Contestant Vote Tallies to Zero (0)
                    </span>
                    <span className="block text-[11px] text-zinc-400 mt-0.5">
                      Check this if you want a clean slate where all contestants start at 0 votes for the new contest. Leave unchecked to keep existing vote tallies.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-between gap-2.5 pt-3.5 border-t border-white/10 mt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isResettingAllDevices}
                  onClick={() => setIsResetAllDevicesModalOpen(false)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 border border-white/15 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={isResettingAllDevices}
                  onClick={() => setIsResetAllDevicesModalOpen(false)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 border border-white/15 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
              <button
                type="button"
                disabled={isResettingAllDevices}
                onClick={handleResetAllDevices}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                {isResettingAllDevices ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Refreshing All Devices...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Refresh All Devices</span>
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
