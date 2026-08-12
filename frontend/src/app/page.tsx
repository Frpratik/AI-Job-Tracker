'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div className="animate-pulse-glow" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Sparkles size={24} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ height: '72px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-indigo) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Sparkles size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>JobTracker</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/login" className="btn-secondary">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div className="badge badge-emerald" style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem' }}>
          <Sparkles size={14} /> Production-Grade Career Intelligence
        </div>
        
        <h1 style={{ fontSize: '3.25rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
          Organize Your Job Search with <br />
          <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-indigo) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Superhuman Clarity
          </span>
        </h1>

        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '650px', marginBottom: '2.5rem' }}>
          Track job applications, schedule multi-round interviews, log recruiter emails & calls, and manage your wishlist with 1-tap pipeline conversion.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <Link href="/register" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
            Start Tracking Free <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
            Demo Account Access
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', width: '100%', textAlign: 'left' }}>
          <div className="card glass-panel">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Zap size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>1-Tap Wishlist Conversion</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Save roles from any job board, then seamlessly transition them to applied with auto date tracking.</p>
          </div>

          <div className="card glass-panel">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-amber-light)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <BarChart3 size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Multi-Round Interviews</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Log technical rounds, coding screens, interviewer feedback, and 1-click Google Meet/Zoom links.</p>
          </div>

          <div className="card glass-panel">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-indigo-light)', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Recruiter Directory & Log</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Store talent contacts with 1-click email/call/LinkedIn and follow-up timeline reminders.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
        © 2026 JobTracker — Production-grade Job Application Platform
      </footer>
    </div>
  );
}
