'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { DashboardData, Interview, Reminder } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Sparkles,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Video,
  ArrowRight,
  TrendingUp,
  Bookmark,
  BellRing,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get<DashboardData>('/dashboard/');
      setData(res);
      if (res.offers > 0) {
        // Subtle celebration if user has active offers
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleReminder = async (reminderId: string) => {
    try {
      await api.post(`/reminders/${reminderId}/toggle/`);
      fetchDashboard();
    } catch {
      // Ignore
    }
  };

  const triggerOfferCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Welcome Hero Bar */}
        <div className="hero-spotlight" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge badge-emerald">
                  <Sparkles size={12} /> Active Job Search
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Targeting {user?.profile?.target_role || 'Senior Roles'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Welcome back, {user?.full_name || 'Candidate'} 👋
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '0.2rem' }}>
                Here is what requires your focus across your applications and upcoming rounds today.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link href="/applications/new" className="btn-primary">
                <Plus size={18} /> Track Application
              </Link>
            </div>
          </div>
        </div>

        {/* Next Interview Spotlight Card */}
        {data?.upcoming_interviews && data.upcoming_interviews.length > 0 && (
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(17, 23, 38, 0.8) 100%)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {(() => {
              const next = data.upcoming_interviews[0];
              const date = new Date(next.scheduled_at);
              const formattedDate = date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: 'var(--shadow-glow)',
                      }}
                    >
                      <Video size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-emerald">NEXT UPCOMING INTERVIEW</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {formattedDate} ({next.duration_minutes} min)
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                        {next.title} {next.company_name ? `• ${next.company_name}` : ''}
                      </h3>
                      {next.interviewer_name && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Interviewer: <strong style={{ color: 'var(--text-main)' }}>{next.interviewer_name}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {next.meeting_url ? (
                      <a
                        href={next.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ padding: '0.65rem 1.25rem' }}
                      >
                        <Video size={16} /> Join Video Meeting
                      </a>
                    ) : (
                      <button
                        className="btn-secondary"
                        onClick={() => alert(`Meeting info: ${next.title} with ${next.company_name || 'team'}`)}
                      >
                        View Details
                      </button>
                    )}
                    <Link
                      href={`/applications/${next.application_id}`}
                      className="btn-secondary"
                      style={{ padding: '0.65rem 1rem' }}
                    >
                      View Role <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Pending Reminders Banner */}
        {data?.pending_reminders && data.pending_reminders.length > 0 && (
          <div
            className="card"
            style={{
              backgroundColor: 'var(--accent-amber-light)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-amber)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BellRing size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {data.pending_reminders[0].title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {data.pending_reminders[0].company_name ? `${data.pending_reminders[0].company_name} • ` : ''}
                    Due {new Date(data.pending_reminders[0].due_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  className="btn-primary"
                  style={{
                    backgroundColor: 'var(--accent-amber)',
                    borderColor: 'var(--accent-amber)',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                  }}
                  onClick={() => handleToggleReminder(data.pending_reminders[0].id)}
                >
                  <CheckCircle2 size={16} /> Mark Completed
                </button>
                <Link href="/calendar" className="btn-ghost" style={{ fontSize: '0.85rem' }}>
                  All Reminders ({data.pending_reminders.length})
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pulse Statistics Grid */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--primary)" /> Application Pulse
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Active */}
            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Pipeline</span>
                <span className="badge badge-emerald">Live</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                {data?.active ?? 0}
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                Submissions in active consideration
              </p>
            </div>

            {/* Interviews */}
            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>In Interviews</span>
                <span className="badge badge-amber">Rounds</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {data?.interviews ?? 0}
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                Screenings, tech & final loops
              </p>
            </div>

            {/* Offers */}
            <div
              className="card glass-panel"
              style={{ padding: '1.25rem', cursor: (data?.offers ?? 0) > 0 ? 'pointer' : 'default' }}
              onClick={() => (data?.offers ?? 0) > 0 && triggerOfferCelebration()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Offers Extended</span>
                <span className="badge badge-emerald">🎉 Win</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                {data?.offers ?? 0}
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                {(data?.offers ?? 0) > 0 ? 'Click to celebrate!' : 'Awaiting offer decisions'}
              </p>
            </div>

            {/* Wishlist */}
            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Wishlist / Saved</span>
                <span className="badge badge-purple">Ready</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                {data?.saved_jobs ?? 0}
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                1-tap convert when applying
              </p>
            </div>
          </div>
        </div>

        {/* Hiring Funnel Stage Breakdown */}
        {data?.funnel && (
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hiring Funnel Progression</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Overall conversion rate from application to offer</p>
              </div>
              <span className="badge badge-indigo">
                {data.total} Total Logged
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              {[
                { label: 'Applied', count: data.funnel.applied || 0, color: 'var(--primary)' },
                { label: 'Screening', count: data.funnel.screening || 0, color: 'var(--accent-blue)' },
                { label: 'Interview', count: data.funnel.interview || 0, color: 'var(--accent-amber)' },
                { label: 'Final Round', count: data.funnel.final || 0, color: 'var(--accent-indigo)' },
                { label: 'Offer', count: data.funnel.offer || 0, color: '#10b981' },
              ].map((stage, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 0.5rem',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stage.color, marginBottom: '0.2rem' }}>
                    {stage.count}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {stage.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Applications Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Pipeline Applications</h3>
            <Link href="/applications" className="btn-ghost" style={{ fontSize: '0.875rem' }}>
              View Pipeline <ChevronRight size={16} />
            </Link>
          </div>

          {data?.recent && data.recent.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.recent.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="card glass-panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.5rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                      }}
                    >
                      {app.job?.company?.name?.charAt(0).toUpperCase() || 'J'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {app.job?.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {app.job?.company?.name} • {app.job?.location || 'Remote'} ({app.job?.work_mode})
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="badge badge-emerald">{app.status_label || app.status}</span>
                    <ChevronRight size={18} color="var(--text-subtle)" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="card glass-panel"
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
              }}
            >
              <Briefcase size={40} color="var(--text-subtle)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                No active applications yet
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Start tracking roles you apply for to see live interview stats and follow-up alerts.
              </p>
              <Link href="/applications/new" className="btn-primary">
                <Plus size={16} /> Track First Application
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
