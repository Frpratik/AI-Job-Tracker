'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, User, Building, Mail, Phone, Globe } from 'lucide-react';

interface AddRecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompany?: string;
  onSuccess?: () => void;
}

export function AddRecruiterModal({
  isOpen,
  onClose,
  defaultCompany = '',
  onSuccess,
}: AddRecruiterModalProps) {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Please provide recruiter name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/recruiters/', {
        name,
        company_name: companyName || null,
        email,
        phone,
        linkedin_url: linkedinUrl,
        notes,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save recruiter contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add Recruiter Contact</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Save HR partners, talent leads, and referral contacts</p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-rose-light)', color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                required
              />
            </div>
            <div>
              <label className="input-label">Company</label>
              <input
                type="text"
                className="input-field"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@google.com"
              />
            </div>
            <div>
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
              />
            </div>
          </div>

          <div>
            <label className="input-label">LinkedIn Profile URL</label>
            <input
              type="url"
              className="input-field"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/sarahjenkins"
            />
          </div>

          <div>
            <label className="input-label">Role / Notes</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Senior Technical Recruiter for Cloud Infrastructure..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Recruiter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
