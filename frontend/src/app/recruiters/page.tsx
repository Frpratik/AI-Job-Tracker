'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Recruiter } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddRecruiterModal } from '@/components/modals/AddRecruiterModal';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  ExternalLink,
  Building,
  User,
  Trash2,
} from 'lucide-react';

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchRecruiters = async () => {
    try {
      const res = await api.get<{ results: Recruiter[] }>('/recruiters/');
      setRecruiters(res.results || []);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete contact for ${name}?`)) return;
    try {
      await api.delete(`/recruiters/${id}/`);
      fetchRecruiters();
    } catch (err: any) {
      alert(err.message || 'Failed to delete recruiter');
    }
  };

  const filtered = recruiters.filter((r) => {
    const query = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      (r.company_name && r.company_name.toLowerCase().includes(query)) ||
      (r.email && r.email.toLowerCase().includes(query))
    );
  });

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Recruiters & Talent Directory
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Manage your talent contacts, hiring managers, and referral network
            </p>
          </div>

          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add Recruiter Contact
          </button>
        </div>

        {/* Search Bar */}
        <div className="glass-panel" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.875rem' }}
              placeholder="Search by recruiter name, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search
              size={16}
              color="var(--text-subtle)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        {/* Directory Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            Loading recruiters directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card glass-panel" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <Users size={48} color="var(--text-subtle)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No recruiter contacts found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              Store hiring manager and talent scout details for fast follow-ups and outreach.
            </p>
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} /> Add First Contact
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filtered.map((r) => (
              <div key={r.id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        flexShrink: 0,
                      }}
                    >
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {r.name}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {r.company_name ? `${r.company_name} • ` : ''}Talent Partner
                      </p>
                    </div>
                  </div>

                  <button
                    className="btn-ghost"
                    onClick={() => handleDelete(r.id, r.name)}
                    style={{ color: 'var(--accent-rose)', padding: '0.4rem' }}
                    title="Delete Recruiter"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {r.notes && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', lineHeight: 1.4 }}>
                    {r.notes}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
                  {r.email && (
                    <a
                      href={`mailto:${r.email}`}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <Mail size={13} /> {r.email}
                    </a>
                  )}
                  {r.phone && (
                    <a
                      href={`tel:${r.phone}`}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <Phone size={13} /> {r.phone}
                    </a>
                  )}
                  {r.linkedin_url && (
                    <a
                      href={r.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--primary)' }}
                    >
                      <ExternalLink size={13} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddRecruiterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchRecruiters}
      />
    </AppLayout>
  );
}
