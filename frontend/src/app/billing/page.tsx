'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Subscription } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Sparkles,
  Check,
  Zap,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  Clock,
  Layers,
  FileCheck,
  TrendingUp,
  FileText,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isYearly, setIsYearly] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [isCanceling, setIsCanceling] = useState<boolean>(false);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState<boolean>(false);

  const fetchSubscription = async () => {
    try {
      const res = await api.get<Subscription>('/billing/subscription/');
      setSubscription(res);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (yearly: boolean) => {
    setIsUpgrading(true);
    try {
      const res = await api.post<Subscription>('/billing/upgrade/', {
        plan: yearly ? 'pro_yearly' : 'pro_monthly',
        yearly,
      });
      setSubscription(res);
      setShowUpgradeSuccess(true);
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => setShowUpgradeSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Upgrade failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your Pro plan and revert to Free Starter?')) return;
    setIsCanceling(true);
    try {
      const res = await api.post<Subscription>('/billing/cancel/');
      setSubscription(res);
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1080px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <span className="badge badge-indigo" style={{ marginBottom: '0.65rem' }}>
            <Sparkles size={12} /> PLANS & SUBSCRIPTION ENTITLEMENTS
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Unlock Unlimited Career Intelligence
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '560px', margin: '0 auto' }}>
            Accelerate your job search with unlimited applications, high-precision ATS resume scans, custom cover letters, and mock interview coaching.
          </p>

          {/* Success Banner */}
          {showUpgradeSuccess && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: '1.25rem',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-emerald-light)',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Zap size={18} fill="currentColor" /> Welcome to JobTracker Pro! All limits have been unlocked.
            </div>
          )}
        </div>

        {/* Current Plan & Quota Usage Meters */}
        {subscription && (
          <div className="card glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  CURRENT ACTIVE PLAN
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.2rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{subscription.plan_label}</h3>
                  <span className={`badge ${subscription.is_pro ? 'badge-emerald' : 'badge-indigo'}`}>
                    {subscription.status_label}
                  </span>
                </div>
              </div>

              {subscription.is_pro ? (
                <button
                  className="btn-ghost"
                  onClick={handleCancel}
                  disabled={isCanceling}
                  style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}
                >
                  {isCanceling ? 'Canceling...' : 'Cancel Pro Subscription'}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => handleUpgrade(isYearly)}
                  disabled={isUpgrading}
                  style={{ fontSize: '0.9rem' }}
                >
                  <Zap size={16} fill="currentColor" /> Upgrade to Pro
                </button>
              )}
            </div>

            {/* Quota Progress Meters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {/* Applications Meter */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Tracked Roles</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {subscription.current_application_count} {subscription.is_pro ? '(Unlimited)' : `/ ${subscription.max_applications}`}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: subscription.is_pro ? '100%' : `${Math.min(100, (subscription.current_application_count / (subscription.max_applications || 15)) * 100)}%`,
                      backgroundColor: 'var(--primary)',
                    }}
                  />
                </div>
              </div>

              {/* AI Scans Meter */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>AI ATS Scans</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {subscription.ai_scans_used_this_month} {subscription.is_pro ? '(Unlimited)' : `/ ${subscription.max_ai_scans}`}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: subscription.is_pro ? '100%' : `${Math.min(100, (subscription.ai_scans_used_this_month / (subscription.max_ai_scans || 5)) * 100)}%`,
                      backgroundColor: 'var(--accent-indigo)',
                    }}
                  />
                </div>
              </div>

              {/* Cover Letters Meter */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>AI Cover Letters</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {subscription.cover_letters_used_this_month} {subscription.is_pro ? '(Unlimited)' : `/ ${subscription.max_cover_letters}`}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: subscription.is_pro ? '100%' : `${Math.min(100, (subscription.cover_letters_used_this_month / (subscription.max_cover_letters || 5)) * 100)}%`,
                      backgroundColor: 'var(--accent-purple)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly vs Annual Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: !isYearly ? 700 : 500, color: !isYearly ? 'var(--text-main)' : 'var(--text-muted)' }}>
            Monthly Billing
          </span>
          <div
            onClick={() => setIsYearly(!isYearly)}
            style={{
              width: '56px',
              height: '30px',
              borderRadius: '999px',
              backgroundColor: isYearly ? 'var(--primary)' : 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              padding: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                transform: isYearly ? 'translateX(26px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: isYearly ? 700 : 500, color: isYearly ? 'var(--text-main)' : 'var(--text-muted)' }}>
              Annual Billing
            </span>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              SAVE 30%
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
          {/* Free Starter */}
          <div
            className="card glass-panel"
            style={{
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Free Starter</h3>
                <span className="badge badge-indigo">CURRENT</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Essential tracking for candidates beginning their job search journey.
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.75rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>$0</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ forever free</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'Up to 15 active job applications',
                  '5 AI ATS Resume scans per month',
                  '5 AI Cover Letter drafts per month',
                  '1 Master resume PDF storage',
                  'Application pipeline & Wishlist tabs',
                  '28-Day Calendar agenda',
                  'Talent Partner & Recruiter directory',
                ].map((feat) => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    <Check size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                className="btn-secondary"
                disabled
                style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}
              >
                Included by Default
              </button>
            </div>
          </div>

          {/* Pro Career Intelligence */}
          <div
            className="card glass-panel"
            style={{
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              border: '2px solid var(--primary)',
              boxShadow: 'var(--shadow-glow)',
              background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '24px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              MOST POPULAR
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Pro Career Intelligence
                </h3>
                <span className="badge badge-emerald">UNLIMITED</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Full career copilot suite for high-velocity candidates aiming for top offers.
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.75rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                  ${isYearly ? '99' : '12'}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {isYearly ? '/ year ($8.25/mo billed annually)' : '/ month'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  '✨ Unlimited Tracked Applications & Wishlists',
                  '✨ Unlimited AI ATS Keyword Matcher & Scanner',
                  '✨ Unlimited Tailored AI Cover Letter Studio',
                  '✨ Unlimited Resumes & Version Storage',
                  '✨ Advanced Funnel & Source ROI Analytics',
                  '✨ AI Mock Interview Coach with STAR Framework',
                  '✨ Complete CSV Spreadsheet & JSON Data Export',
                  '✨ Priority 24/7 Candidate Support',
                ].map((feat) => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <Check size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                className="btn-primary"
                onClick={() => handleUpgrade(isYearly)}
                disabled={isUpgrading || (subscription?.is_pro ?? false)}
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }}
              >
                <Zap size={16} fill="currentColor" />
                {subscription?.is_pro
                  ? 'Currently Active on Pro'
                  : isUpgrading
                  ? 'Activating Pro...'
                  : `Upgrade to Pro (${isYearly ? '$99/yr' : '$12/mo'})`}
              </button>
            </div>
          </div>
        </div>

        {/* Guarantee Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={18} color="var(--primary)" /> 30-Day Money Back Guarantee
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <CreditCard size={18} color="var(--primary)" /> Secure 256-Bit Encrypted Payments
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Clock size={18} color="var(--primary)" /> Cancel Anytime with 1 Click
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
