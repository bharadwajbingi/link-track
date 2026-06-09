import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, Users, ArrowLeft } from 'lucide-react';

export function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setInfoMsg('Password reset email sent! Check your inbox.');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        setInfoMsg('Check your email for the confirmation link to complete registration!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-brand-500/3 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-glow" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2.5">
          <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Users className="text-white" size={22} />
          </div>
          <span className="text-white font-extrabold text-2xl tracking-tight">LinkTrack</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          {mode === 'forgot' ? 'Reset your password' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        {mode !== 'forgot' && (
          <p className="mt-2 text-center text-sm text-surface-400">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className="font-semibold text-brand-400 hover:text-brand-300 transition-colors focus:outline-none"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <p className="mt-2 text-center text-sm text-surface-400">
            Enter your email and we will send you a reset link.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-surface-900/60 backdrop-blur-xl py-8 px-4 shadow-xl border border-white/[0.06] rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleAuth}>
            {errorMsg && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-medium text-rose-400">
                {errorMsg}
              </div>
            )}
            {infoMsg && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-medium text-emerald-400">
                {infoMsg}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-950/50 border border-white/[0.08] text-white rounded-xl text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-950/50 border border-white/[0.08] text-white rounded-xl text-sm placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-xs text-surface-400 hover:text-brand-400 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 hover:shadow-glow-brand active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'forgot' ? <Mail size={16} /> : <LogIn size={16} />}
                    {mode === 'forgot' ? 'Send Reset Link' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
                  </>
                )}
              </button>
            </div>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-surface-400 hover:text-white transition-colors mt-2"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
