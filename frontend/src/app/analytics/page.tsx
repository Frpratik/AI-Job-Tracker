'use client';

import React, { useState, useEffect } from 'react';
import { api, tokenStorage } from '@/lib/api';
import { AnalyticsData } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  Download,
  Calendar,
  Briefcase,
  Share2,
  PieChart,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAnalytics = async (tf: string) => {
    setIsLoading(true);
    try {
      const res = await api.get<AnalyticsData>(`/analytics/?timeframe=${tf}`);
      setData(res);
      if (res.summary.offer_count > 0) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
      const access = tokenStorage.getAccess();
      const response = await fetch(`${API_BASE_URL}/analytics/export/csv/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job_tracker_applications_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
      const access = tokenStorage.getAccess();
      const response = await fetch(`${API_BASE_URL}/analytics/export/json/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      const json = await response.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Failed to export JSON: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const maxWeeklyCount = data ? Math.max(...data.weekly_activity.map((w) => w.count), 1) : 1;

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Career Intelligence & Analytics
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Conversion funnel, response velocities, source ROI, and data export
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Timeframe Selector */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-card)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                gap: '0.25rem',
              }}
            >
              {[
                { key: 'all', label: 'All Time' },
                { key: '30d', label: '30 Days' },
                { key: '90d', label: '90 Days' },
                { key: '1y', label: '1 Year' },
              ].map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: timeframe === tf.key ? 'var(--primary)' : 'transparent',
                    color: timeframe === tf.key ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Export Buttons */}
            <button
              className="btn-secondary"
              onClick={handleExportCSV}
              disabled={isExporting}
              style={{ padding: '0.55rem 0.95rem', fontSize: '0.85rem' }}
              title="Download CSV Spreadsheet"
            >
              <FileSpreadsheet size={15} color="var(--primary)" /> Export CSV
            </button>
            <button
              className="btn-secondary"
              onClick={handleExportJSON}
              disabled={isExporting}
              style={{ padding: '0.55rem 0.95rem', fontSize: '0.85rem' }}
              title="Download JSON Archive"
            >
              <FileCode size={15} color="var(--accent-indigo)" /> Export JSON
            </button>
          </div>
        </div>

        {isLoading || !data ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
            Calculating career metrics and analytics...
          </div>
        ) : (
          <>
            {/* 4 Executive Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {/* Interview Rate */}
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Interview Conversion Rate
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent-indigo-light)',
                      color: 'var(--accent-indigo)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {data.rates.interview_rate_pct}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  {data.summary.interview_count} of {data.summary.applied_count} active submissions
                </div>
              </div>

              {/* Offer Rate */}
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Offer Conversion Rate
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Award size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {data.rates.offer_rate_pct}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  {data.summary.offer_count} offers • {data.rates.interview_to_offer_pct}% from interviews
                </div>
              </div>

              {/* Avg Response Velocity */}
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Avg Response Velocity
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent-amber-light)',
                      color: 'var(--accent-amber)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {data.rates.avg_response_days}{' '}
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>days</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  From applied to first contact or round
                </div>
              </div>

              {/* Avg Target Compensation */}
              <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Avg Pipeline Max Salary
                  </span>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent-purple-light)',
                      color: 'var(--accent-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DollarSign size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  ${Math.round(data.compensation.avg_salary_max).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  Min Avg: ${Math.round(data.compensation.avg_salary_min).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Conversion Funnel Progression */}
            <div className="card glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Hiring Conversion Funnel</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Stage-by-stage conversion from initial submission through offer acceptance
                  </p>
                </div>
                <span className="badge badge-emerald">
                  <Sparkles size={12} /> {data.summary.applied_count} Total Submissions
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.funnel.map((item, index) => {
                  const colors = [
                    'var(--primary)',
                    'var(--accent-blue)',
                    'var(--accent-indigo)',
                    'var(--accent-amber)',
                    '#10B981',
                  ];
                  const barColor = colors[index % colors.length];

                  return (
                    <div key={item.stage} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.stage}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 800, color: barColor }}>
                            {item.count} roles
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-main)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {item.pct}%
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          height: '10px',
                          borderRadius: '999px',
                          backgroundColor: 'var(--bg-main)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.max(item.pct, 4)}%`,
                            backgroundColor: barColor,
                            borderRadius: '999px',
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2-Column Grid: Discovery Source ROI + Weekly Activity Velocity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
              {/* Discovery Source ROI */}
              <div className="card glass-panel" style={{ padding: '1.75rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Discovery Source ROI</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Which channels yield the highest interview conversion
                  </p>
                </div>

                {data.source_roi.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No source data recorded yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {data.source_roi.map((src) => (
                      <div
                        key={src.source}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-main)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                            {src.source}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {src.total_applications} applied • {src.interviews} interviews • {src.offers} offers
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            className={`badge ${
                              src.conversion_rate_pct >= 50
                                ? 'badge-emerald'
                                : src.conversion_rate_pct >= 25
                                ? 'badge-indigo'
                                : 'badge-amber'
                            }`}
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.65rem' }}
                          >
                            {src.conversion_rate_pct}% ROI
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weekly Velocity Chart */}
              <div className="card glass-panel" style={{ padding: '1.75rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Application Velocity</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Submissions per week over the last 8 weeks
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: '180px',
                    paddingTop: '1rem',
                    gap: '0.5rem',
                  }}
                >
                  {data.weekly_activity.map((w) => {
                    const heightPct = (w.count / maxWeeklyCount) * 100;

                    return (
                      <div
                        key={w.week_label}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          height: '100%',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {w.count}
                        </span>

                        <div
                          style={{
                            width: '100%',
                            maxWidth: '32px',
                            height: `${Math.max(heightPct, 6)}%`,
                            borderRadius: '6px 6px 0 0',
                            backgroundColor: w.count > 0 ? 'var(--primary)' : 'var(--bg-main)',
                            border: '1px solid var(--border-color)',
                            transition: 'height 0.4s ease',
                          }}
                        />

                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {w.week_label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Work Mode & Compensation Breakdown */}
            <div className="card glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Work Style & Location Distribution</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Breakdown of tracked roles by workplace flexibility
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Remote Roles
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>
                    {data.compensation.work_mode_distribution.remote || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Full remote flexibility</span>
                </div>

                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Hybrid Roles
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-indigo)', margin: '0.25rem 0' }}>
                    {data.compensation.work_mode_distribution.hybrid || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Split office & home</span>
                </div>

                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    On-Site Roles
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '0.25rem 0' }}>
                    {data.compensation.work_mode_distribution.onsite || 0}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Office location</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
