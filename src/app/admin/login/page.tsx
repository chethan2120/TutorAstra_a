'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      router.push('/admin/dashboard');
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
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-navy flex items-center justify-between">
            <span>🔑 Active Login Credentials:</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Ready</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200">
              <span className="text-navy font-bold">Admin:</span>
              <span>admin@gmail.com / demo123</span>
            </div>
            <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200">
              <span className="text-navy font-bold">Teacher:</span>
              <span>teacher@gmail.com / demo123</span>
            </div>
            <div className="flex justify-between items-center bg-white p-1.5 rounded border border-slate-200">
              <span className="text-navy font-bold">Student:</span>
              <span>student@gmail.com / demo123</span>
            </div>
          </div>
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
