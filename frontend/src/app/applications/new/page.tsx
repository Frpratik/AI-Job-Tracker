'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Briefcase,
  Bookmark,
  Building,
  MapPin,
  Link as LinkIcon,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

function NewApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWishlistInit = searchParams.get('wishlist') === 'true';

  const [isWishlist, setIsWishlist] = useState(isWishlistInit);
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [workMode, setWorkMode] = useState('remote');
  const [priority, setPriority] = useState('medium');
  const [source, setSource] = useState('LinkedIn');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [appliedDate, setAppliedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !title) {
      setError('Please provide company name and job title.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        job: {
          company: { name: company },
          title,
          location,
          url,
          work_mode: workMode,
          employment_type: 'full_time',
          salary_min: salaryMin ? parseFloat(salaryMin) : null,
          salary_max: salaryMax ? parseFloat(salaryMax) : null,
          salary_currency: 'USD',
        },
        status: isWishlist ? 'wishlist' : 'applied',
        applied_date: isWishlist ? null : appliedDate,
        source,
        priority,
      };

      const res = await api.post('/applications/', payload);
      router.push(`/applications/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <Link
        href="/applications"
        className="btn-ghost"
        style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <ArrowLeft size={16} /> Back to Applications
      </Link>

      <div className="card glass-panel" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {isWishlist ? 'Save Job to Wishlist' : 'Track New Application'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isWishlist
              ? 'Save interesting roles from job boards to easily convert when you submit'
              : 'Add a job you have applied for to your active hiring pipeline'}
          </p>
        </div>

        {/* Toggle Type */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            backgroundColor: 'var(--bg-main)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => setIsWishlist(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: !isWishlist ? 'var(--primary)' : 'transparent',
              color: !isWishlist ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Briefcase size={16} /> Active Application (Applied)
          </button>
          <button
            type="button"
            onClick={() => setIsWishlist(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: isWishlist ? 'var(--accent-purple)' : 'transparent',
              color: isWishlist ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Bookmark size={16} /> Save to Wishlist (Apply Later)
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-rose-light)',
              color: 'var(--accent-rose)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="input-label">Company Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. Stripe, Figma, Apple"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
                <Building
                  size={18}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Job Title / Role *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Briefcase
                  size={18}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="input-label">Location</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. Remote, San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <MapPin
                  size={18}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Work Mode</label>
              <select
                className="input-field"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="input-label">Job Posting / Application URL</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="https://jobs.company.com/role/123"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <LinkIcon
                  size={18}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Priority</label>
              <select
                className="input-field"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="input-label">Discovery Source</label>
              <select
                className="input-field"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Direct Referral / Network</option>
                <option value="Company Website">Company Careers Page</option>
                <option value="Indeed">Indeed</option>
                <option value="Wellfound">Wellfound (AngelList)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {!isWishlist && (
              <div>
                <label className="input-label">Date Applied</label>
                <input
                  type="date"
                  className="input-field"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => router.push('/applications')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2, backgroundColor: isWishlist ? 'var(--accent-purple)' : undefined }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : isWishlist
                ? 'Save to Wishlist'
                : 'Track Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewApplicationPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading form...</div>}>
        <NewApplicationForm />
      </Suspense>
    </AppLayout>
  );
}
