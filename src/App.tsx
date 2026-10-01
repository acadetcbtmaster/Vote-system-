import React, { useState, useEffect } from 'react';
import { api, getStoredToken } from './services/api';
import { UserProfile } from './types';
import { Save30Logo } from './components/Save30Logo';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { TermsModal } from './components/TermsModal';
import { PrivacyModal } from './components/PrivacyModal';
import {
  ShieldCheck,
  TrendingUp,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  Shield,
  CreditCard,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  KeyRound,
  X,
  Loader2,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminRole, setAdminRole] = useState('super_admin');

  // Modals
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAdminKeyModalOpen, setIsAdminKeyModalOpen] = useState(false);
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [adminKeyError, setAdminKeyError] = useState<string | null>(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Check URL params for admin flag or payment callback
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('admin') || params.get('portal') === 'admin') {
        if (currentUser && currentUser.role === 'user') {
          // Regular saver attempting to access /admin
          alert('Access Denied: Regular user accounts do not have administrator permissions.');
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        setIsAdminKeyModalOpen(true);
      }
    } catch {}
  }, [currentUser]);

  // Initial user session fetch
  useEffect(() => {
    const initSession = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setCurrentUser(res.user);
            if (res.user.role !== 'user') {
              setAdminRole(res.user.role);
            }
          }
        } catch {
          api.logout();
        }
      }
      setIsInitializing(false);
    };

    initSession();
  }, []);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setIsAdminView(false);
  };

  const handleAdminKeyVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKeyError(null);
    setIsVerifyingAdmin(true);

    try {
      const res = await api.verifyAdminKey(adminSecretKey);
      if (res.valid && res.user) {
        if (res.user.role === 'user') {
          setAdminKeyError('Access Denied: Regular saver accounts cannot access the administrative portal.');
          return;
        }
        setIsAdminKeyModalOpen(false);
        setAdminRole(res.user.role);
        setCurrentUser(res.user);
        setIsAdminView(true);
      } else {
        setAdminKeyError('Invalid administrator credentials.');
      }
    } catch (err: any) {
      setAdminKeyError(err.message || 'Authorization failed.');
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center p-4">
        <Save30Logo size="lg" className="animate-pulse" />
      </div>
    );
  }

  // 1. ADMIN VIEW (STRICT ROLE AUTHORIZATION CHECK)
  if (isAdminView) {
    if (!currentUser || currentUser.role === 'user') {
      return (
        <div className="min-h-screen bg-[#080C14] flex items-center justify-center p-4 text-center">
          <div className="max-w-md p-6 sm:p-8 rounded-2xl bg-[#0F1622] border border-red-500/30 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white">403 — Administrator Access Denied</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Standard user accounts created through the registration page do not have permission to access the Save30 Administrator Portal.
            </p>
            <button
              onClick={() => setIsAdminView(false)}
              className="py-2.5 px-6 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Return to User Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <AdminDashboard
        onBackToApp={() => setIsAdminView(false)}
        currentAdminRole={currentUser.role}
      />
    );
  }

  // 2. LOGGED IN MEMBER DASHBOARD VIEW
  if (currentUser) {
    return (
      <>
        <UserDashboard
          user={currentUser}
          onLogout={handleLogout}
          onOpenAdmin={currentUser.role !== 'user' ? () => setIsAdminView(true) : undefined}
          onOpenTerms={() => setIsTermsOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />
        {isTermsOpen && (
          <TermsModal onClose={() => setIsTermsOpen(false)} />
        )}
        {isPrivacyOpen && (
          <PrivacyModal onClose={() => setIsPrivacyOpen(false)} />
        )}
      </>
    );
  }

  // 3. PUBLIC MARKETING & ONBOARDING LANDING PAGE
  return (
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col font-sans selection:bg-[#00875A] selection:text-white">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-[#0C121D]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Save30Logo size="md" showTagline />

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setAuthModalMode('login')}
              className="py-1.5 px-3 sm:px-4 rounded-xl text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={() => setAuthModalMode('register')}
              className="py-2 px-3.5 sm:px-5 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white text-xs font-extrabold shadow-lg shadow-[#00875A]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#00875A]/15 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00875A]/15 border border-[#00A86B]/30 text-[#00A86B] text-xs font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Disciplined Daily Savings for Nigeria</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Save <span className="text-[#00A86B]">₦200 Daily</span>.<br />
              30 Core Days + 3 Commitment Days.<br />
              Unlock <span className="text-[#00A86B]">₦6,000 Payout</span>.
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Real People. Real Discipline. Real Payouts. Join thousands of Nigerians building financial freedom one day at a time with automated daily tracking and guaranteed NUBAN payouts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setAuthModalMode('register')}
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#00875A]/30 transition-all cursor-pointer transform active:scale-98"
              >
                <span>OPEN YOUR SAVE30 VAULT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setAuthModalMode('login')}
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Access Existing Vault
              </button>
            </div>
          </div>
        </section>

        {/* Core Value Pillars Grid */}
        <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#00875A]/20 border border-[#00A86B]/30 flex items-center justify-center text-[#00A86B]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">₦200 Daily</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Small, manageable daily contributions designed to build unshakeable savings habits without financial stress.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#00875A]/20 border border-[#00A86B]/30 flex items-center justify-center text-[#00A86B]">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">Sequential 33 Days</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Strict sequential verification. Day 1 through Day 33 must each be confirmed to maintain discipline and unlock payouts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#00875A]/20 border border-[#00A86B]/30 flex items-center justify-center text-[#00A86B]">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">₦6,000 Payout</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Fixed ₦6,000 eligible payout (₦200 × 30 core days) paid directly to your Nigerian commercial or microfinance bank account.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F1622] border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#00875A]/20 border border-[#00A86B]/30 flex items-center justify-center text-[#00A86B]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white">Immutable Ledger</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every payment receives an immutable reference with printable transaction receipts and server-verified idempotency.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4 sm:px-6 bg-[#0B1019] border-y border-white/10">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#00A86B]">
                Simple &amp; Disciplined
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                How Save30 Works
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="w-9 h-9 rounded-full bg-[#00875A] text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0">
                  1
                </div>
                <h4 className="text-sm font-black text-white">Register</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Sign up and receive your unique User ID (e.g. <code>SAVE30-001</code>).
                </p>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="w-9 h-9 rounded-full bg-[#00875A] text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0">
                  2
                </div>
                <h4 className="text-sm font-black text-white">Save Daily</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Pay ₦200 daily sequentially. Day 2 unlocks once Day 1 is verified.
                </p>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="w-9 h-9 rounded-full bg-[#00875A] text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0">
                  3
                </div>
                <h4 className="text-sm font-black text-white">Commitment Days</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Complete Days 31–33 to fulfill your commitment and unlock withdrawal.
                </p>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="w-9 h-9 rounded-full bg-[#00875A] text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0">
                  4
                </div>
                <h4 className="text-sm font-black text-white">Receive ₦6,000</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Request payout to your bank. Start a fresh cycle to repeat!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#00A86B]">
              Transparency First
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Why are there 33 days instead of 30 days?',
                a: 'Save30 is built around true financial discipline. The first 30 days form your core savings (₦200 × 30 = ₦6,000). The subsequent 3 days (Days 31–33) are your commitment bond that validates your habit before unlocking payout.',
              },
              {
                q: 'Can I skip days or pay ahead out of order?',
                a: 'No. The platform enforces strict sequential verification. Day 5 can only be paid after Day 4 has been confirmed as successful on the backend.',
              },
              {
                q: 'How much do I receive when I finish Day 33?',
                a: 'You receive exactly ₦6,000, calculated dynamically as your 30 core days at ₦200 per day. The user cannot request an arbitrary or unauthorized amount.',
              },
              {
                q: 'How are payouts processed?',
                a: 'Payouts are manually verified and processed via direct Nigerian bank transfer (NUBAN) by Save30 finance administrators within 1 to 24 hours of request.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0F1622] border border-white/10 text-xs transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between font-bold text-white text-left cursor-pointer"
                >
                  <span>{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#00A86B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="mt-2 text-zinc-400 leading-relaxed pt-2 border-t border-white/5">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 bg-[#0B1019] text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Save30Logo size="sm" />
            <span className="text-zinc-500">| Real People. Real Discipline. Real Winners.</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setIsAdminKeyModalOpen(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-xs"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Register / Forgot) */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={u => {
            setAuthModalMode(null);
            setCurrentUser(u);
          }}
          onOpenTerms={() => setIsTermsOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />
      )}

      {/* Admin Key Login Modal */}
      {isAdminKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#0F1622] border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">Administrator Access</h3>
              </div>
              <button
                onClick={() => setIsAdminKeyModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your administrative secret key or sign in with your admin credentials to access member oversight, withdrawal processing, and audit logs.
            </p>

            {adminKeyError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                {adminKeyError}
              </div>
            )}

            <form onSubmit={handleAdminKeyVerify} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold uppercase mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  required
                  value={adminSecretKey}
                  onChange={e => setAdminSecretKey(e.target.value)}
                  placeholder="Enter admin secret key"
                  className="w-full p-2.5 bg-[#0D131C] border border-white/15 focus:border-indigo-500 text-white rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingAdmin}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifyingAdmin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>AUTHORIZE &amp; ENTER PORTAL</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Terms & Privacy Modals */}
      {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
      {isPrivacyOpen && <PrivacyModal onClose={() => setIsPrivacyOpen(false)} />}
    </div>
  );
}
