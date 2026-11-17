'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, deskPath } from '@/lib/demo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInAs = async (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail, password: DEMO_PASSWORD }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      router.push(deskPath(data.user.role));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user.role === 'teacher') router.push('/teacher');
      else if (data.user.role === 'student') router.push('/student');
      else router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#240047] p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-card-hover space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="mb-3 inline-block">
            <img
              src="/tutorastra-logo.jpg"
              alt="TutorAstra"
              width={72}
              height={72}
              className="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-[#F4CC45]"
            />
          </Link>
          <p className="font-display text-3xl font-semibold text-[#310064]">TutorAstra</p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F0E9FA] px-3 py-1 text-xs font-bold uppercase text-[#6527B8]">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Management Console</span>
          </div>
          <h1 className="text-2xl font-black text-navy mt-2">Team Authentication</h1>
          <p className="text-xs text-slate-500">
            Sign in to manage courses, update curriculum topics, and process parent enquiries.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-navy">Password</label>
              <Link
                href="/admin/reset-password"
                className="text-[11px] text-brand-blue hover:underline font-semibold"
              >
                Reset Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#310064] py-3.5 text-sm font-bold text-white shadow-soft transition-all hover:bg-[#6527B8] disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#F4CC45]" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4 text-[#F4CC45]" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box for Evaluation */}
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <div className="font-bold text-navy">One-click sign in</div>
          {DEMO_ACCOUNTS.filter((account) => account.login).map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => signInAs(account.email)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left"
            >
              <span className="font-bold text-navy">{account.label}</span>
              <span className="font-mono text-[11px]">{account.email}</span>
            </button>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-slate-500 hover:text-navy transition-colors">
            ← Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
