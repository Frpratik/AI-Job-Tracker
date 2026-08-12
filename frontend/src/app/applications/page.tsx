'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Application } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Briefcase,
  Bookmark,
  Search,
  Plus,
  Send,
  MapPin,
  ChevronRight,
} from 'lucide-react';

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialWishlist = searchParams.get('tab') === 'wishlist';

  const [activeTab, setActiveTab] = useState<'active' | 'wishlist'>(initialWishlist ? 'wishlist' : 'active');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');

  const fetchApplications = async () => {
    try {
      const res = await api.get<{ results: Application[] }>('/applications/');
      setApplications(res.results || []);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleConvertWishlist = async (appId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post(`/applications/${appId}/convert/`);
      await fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Failed to convert wishlist item');
    }
  };

  const activeApps = applications.filter((a) => a.status !== 'wishlist');
  const wishlistApps = applications.filter((a) => a.status === 'wishlist');

  const currentList = activeTab === 'active' ? activeApps : wishlistApps;

  const filtered = currentList.filter((app) => {
    const title = app.job?.title?.toLowerCase() || '';
    const company = app.job?.company?.name?.toLowerCase() || '';
    const location = app.job?.location?.toLowerCase() || '';
    const matchesSearch = !search || title.includes(search.toLowerCase()) || company.includes(search.toLowerCase()) || location.includes(search.toLowerCase());
    const matchesStatus = !statusFilter || app.status === statusFilter;
    const matchesPriority = !priorityFilter || app.priority === priorityFilter;
    const matchesMode = !workModeFilter || app.job?.work_mode === workModeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesMode;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'offer':
      case 'accepted':
        return 'badge-emerald';
      case 'technical_interview':
      case 'hr_interview':
      case 'final_interview':
      case 'assessment':
        return 'badge-amber';
      case 'screening':
        return 'badge-blue';
      case 'rejected':
      case 'withdrawn':
        return 'badge-rose';
      case 'wishlist':
        return 'badge-purple';
      default:
        return 'badge-indigo';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Tab Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Applications & Job Pipeline
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage your active submissions, interviews, and wishlist bookmarks
          </p>
        </div>

        <Link href="/applications/new" className="btn-primary">
          <Plus size={18} /> Add Application / Job
        </Link>
      </div>

      {/* Segmented Pipeline Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-card)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          width: 'fit-content',
          gap: '0.35rem',
        }}
      >
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: activeTab === 'active' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'active' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Briefcase size={16} /> Active Pipeline ({activeApps.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: activeTab === 'wishlist' ? 'var(--accent-purple)' : 'transparent',
            color: activeTab === 'wishlist' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Bookmark size={16} /> Saved Jobs (Wishlist) ({wishlistApps.length})
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.5rem', paddingRight: '1rem', height: '40px', fontSize: '0.875rem' }}
            placeholder="Search by role, company, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={16}
            color="var(--text-subtle)"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {activeTab === 'active' && (
          <select
            className="input-field"
            style={{ width: 'auto', minWidth: '150px', height: '40px', fontSize: '0.875rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="screening">Screening</option>
            <option value="technical_interview">Technical</option>
            <option value="hr_interview">HR Screen</option>
            <option value="final_interview">Final Round</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        )}

        <select
          className="input-field"
          style={{ width: 'auto', minWidth: '130px', height: '40px', fontSize: '0.875rem' }}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="input-field"
          style={{ width: 'auto', minWidth: '130px', height: '40px', fontSize: '0.875rem' }}
          value={workModeFilter}
          onChange={(e) => setWorkModeFilter(e.target.value)}
        >
          <option value="">All Modes</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>

        {(search || statusFilter || priorityFilter || workModeFilter) && (
          <button
            className="btn-ghost"
            style={{ fontSize: '0.85rem' }}
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
              setWorkModeFilter('');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          Loading applications...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card glass-panel"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
          }}
        >
          {activeTab === 'active' ? (
            <>
              <Briefcase size={48} color="var(--text-subtle)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                No active applications match your filter
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                Track jobs you have submitted or convert roles from your saved wishlist.
              </p>
              <Link href="/applications/new" className="btn-primary">
                <Plus size={16} /> Track New Application
              </Link>
            </>
          ) : (
            <>
              <Bookmark size={48} color="var(--accent-purple)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Your Saved Jobs wishlist is empty
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                Bookmark positions you are interested in applying for later, and convert them with 1 click when you submit!
              </p>
              <Link href="/applications/new?wishlist=true" className="btn-primary" style={{ backgroundColor: 'var(--accent-purple)' }}>
                <Plus size={16} /> Save a Job Role
              </Link>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
          {filtered.map((app) => (
            <div
              key={app.id}
              className="card glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                padding: '1.25rem 1.5rem',
                gap: '1rem',
                cursor: 'pointer',
              }}
              onClick={() => router.push(`/applications/${app.id}`)}
            >
              {/* Company & Role Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 240px', minWidth: 0 }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: activeTab === 'wishlist' ? 'var(--accent-purple-light)' : 'var(--primary-light)',
                    color: activeTab === 'wishlist' ? 'var(--accent-purple)' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  {app.job?.company?.name?.charAt(0).toUpperCase() || 'J'}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {app.job?.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {app.job?.company?.name}
                    </span>
                    {app.job?.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                        <MapPin size={13} /> {app.job.location}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600 }}>
                      {app.job?.work_mode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status, Priority & Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {activeTab === 'wishlist' ? (
                  <button
                    className="btn-primary"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.825rem',
                      backgroundColor: 'var(--primary)',
                    }}
                    onClick={(e) => handleConvertWishlist(app.id, e)}
                  >
                    <Send size={14} /> Convert to Applied
                  </button>
                ) : (
                  <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                    {app.status_label || app.status}
                  </span>
                )}

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor:
                      app.priority === 'high'
                        ? 'var(--accent-rose-light)'
                        : app.priority === 'medium'
                        ? 'var(--accent-amber-light)'
                        : 'var(--bg-subtle)',
                    color:
                      app.priority === 'high'
                        ? 'var(--accent-rose)'
                        : app.priority === 'medium'
                        ? 'var(--accent-amber)'
                        : 'var(--text-muted)',
                  }}
                >
                  {app.priority}
                </span>

                <ChevronRight size={18} color="var(--text-subtle)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading pipeline...</div>}>
        <ApplicationsContent />
      </Suspense>
    </AppLayout>
  );
}
