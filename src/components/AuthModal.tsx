import React, { useState } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { Save30Logo } from './Save30Logo';
import { PasswordInput } from './PasswordInput';
import { X, ArrowRight, AlertCircle, CheckCircle2, Shield, Loader2, Lock, Mail, Phone, User } from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Registration Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password Fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError('You must accept the Save30 Terms & Conditions and Privacy Policy.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
        referral_code: referralCode.trim() || undefined,
        accept_terms: acceptTerms,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login({
        email: loginIdentifier,
        password: loginPassword,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.forgotPassword(forgotEmail);
      setForgotSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0F1622] border border-[#00A86B]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B1019]">
          <Save30Logo size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-white/10 bg-[#090D14]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer text-center ${
                mode === 'login'
                  ? 'text-[#00A86B] border-b-2 border-[#00A86B] bg-[#00875A]/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer text-center ${
                mode === 'register'
                  ? 'text-[#00A86B] border-b-2 border-[#00A86B] bg-[#00875A]/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email Address or Save30 User ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. name@example.com or SAVE30-001"
                    className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <PasswordInput
                label="Password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Enter your account password"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                  }}
                  className="text-zinc-400 hover:text-[#00A86B] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-[#00A86B] font-bold hover:underline cursor-pointer"
                >
                  Need an account?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00875A]/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN TO DASHBOARD</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : mode === 'register' ? (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="e.g. Ibrahim"
                    className="w-full px-3 py-2 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="e.g. Musa"
                    className="w-full px-3 py-2 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. ibrahim@example.ng"
                    className="w-full px-3 py-2 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full px-3 py-2 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                  />
                  <Phone className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <PasswordInput
                label="Create Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                helperText="Must be at least 6 characters long."
              />

              <PasswordInput
                label="Confirm Password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  placeholder="e.g. SAVE30-REF"
                  className="w-full px-3 py-2 bg-[#0D131C] border border-white/10 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                />
              </div>

              {/* Terms and Privacy Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-[#00A86B] focus:ring-[#00A86B] cursor-pointer"
                  />
                  <span className="leading-snug">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={onOpenTerms}
                      className="text-[#00A86B] font-bold hover:underline inline"
                    >
                      Terms &amp; Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={onOpenPrivacy}
                      className="text-[#00A86B] font-bold hover:underline inline"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00875A]/25 transition-all cursor-pointer disabled:opacity-50 mt-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating your Save30 account...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER &amp; START SAVING</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORGOT PASSWORD FORM */
            <div className="space-y-4">
              {forgotSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#00875A]/20 text-[#00A86B] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Reset Link Sent</h4>
                  <p className="text-xs text-zinc-400">
                    If an account is associated with {forgotEmail}, instructions have been dispatched.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setForgotSuccess(false);
                    }}
                    className="py-2 px-4 rounded-xl bg-[#00875A] text-white text-xs font-bold"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Reset Password</h4>
                    <p className="text-xs text-zinc-400 mb-3">
                      Enter your account email address and we will provide password recovery steps.
                    </p>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full px-3.5 py-2.5 bg-[#0D131C] border border-white/15 focus:border-[#00A86B] text-white text-xs rounded-xl outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 text-zinc-300 text-xs font-bold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 rounded-xl bg-[#00875A] hover:bg-[#00A86B] text-white text-xs font-bold"
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
