'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, Mail, Phone, MessageSquare, Video } from 'lucide-react';

interface LogCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  recruiterId?: string | null;
  onSuccess?: () => void;
}

export function LogCommunicationModal({
  isOpen,
  onClose,
  applicationId,
  recruiterId,
  onSuccess,
}: LogCommunicationModalProps) {
  const [channel, setChannel] = useState('email');
  const [direction, setDirection] = useState<'outbound' | 'inbound'>('outbound');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [contactDate, setContactDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const channels = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone_call', label: 'Phone Call', icon: Phone },
    { value: 'linkedin', label: 'LinkedIn DM', icon: MessageSquare },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'video_call', label: 'Video Call', icon: Video },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) {
      setError('Please select an application to log communication for.');
      return;
    }
    if (!summary) {
      setError('Please enter a brief summary of the conversation.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/applications/${applicationId}/communications/`, {
        recruiter_id: recruiterId || null,
        channel,
        direction,
        summary,
        details,
        contact_date: contactDate,
        follow_up_date: followUpDate || null,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log interaction');
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
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Log Recruiter Interaction</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Keep track of all emails, calls, and follow-ups</p>
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
          {/* Channel Selector Chips */}
          <div>
            <label className="input-label">Channel</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {channels.map((c) => {
                const isSelected = channel === c.value;
                const Icon = c.icon;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChannel(c.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-main)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={16} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direction Toggle */}
          <div>
            <label className="input-label">Direction</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDirection('outbound')}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: direction === 'outbound' ? 'var(--accent-indigo-light)' : 'var(--bg-main)',
                  border: `1px solid ${direction === 'outbound' ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                  color: direction === 'outbound' ? 'var(--accent-indigo)' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Outbound (I reached out)
              </button>
              <button
                type="button"
                onClick={() => setDirection('inbound')}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: direction === 'inbound' ? 'var(--accent-indigo-light)' : 'var(--bg-main)',
                  border: `1px solid ${direction === 'inbound' ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                  color: direction === 'inbound' ? 'var(--accent-indigo)' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Inbound (They contacted me)
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">Summary / Subject</label>
            <input
              type="text"
              className="input-field"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Sent introductory note with updated portfolio"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Contact Date</label>
              <input
                type="date"
                className="input-field"
                value={contactDate}
                onChange={(e) => setContactDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Next Follow-up Date (Optional)</label>
              <input
                type="date"
                className="input-field"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Notes & Next Steps</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Salary range discussed, recruiter mentioned team structure..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
