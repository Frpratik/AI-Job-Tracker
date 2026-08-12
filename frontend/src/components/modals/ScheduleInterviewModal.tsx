'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, Calendar, Video, User } from 'lucide-react';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  companyName?: string;
  onSuccess?: () => void;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  applicationId,
  companyName,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const [roundNumber, setRoundNumber] = useState(1);
  const [interviewType, setInterviewType] = useState('technical');
  const [title, setTitle] = useState('Technical Interview');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const interviewTypes = [
    { value: 'recruiter_screen', label: 'Recruiter Screen' },
    { value: 'technical', label: 'Technical Interview' },
    { value: 'coding', label: 'Live Coding' },
    { value: 'system_design', label: 'System Design' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'hiring_manager', label: 'Hiring Manager' },
    { value: 'hr', label: 'HR Interview' },
    { value: 'onsite', label: 'On-site Loop' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) {
      setError('Please select an application to link this interview to.');
      return;
    }
    if (!scheduledAt) {
      setError('Please select date and time for the interview.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/applications/${applicationId}/interviews/`, {
        round_number: Number(roundNumber),
        interview_type: interviewType,
        title: title || `${interviewTypes.find(t => t.value === interviewType)?.label} Round ${roundNumber}`,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: Number(durationMinutes),
        interviewer_name: interviewerName,
        interviewer_email: interviewerEmail,
        meeting_url: meetingUrl,
        notes,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview');
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
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Schedule Interview Round</h3>
            {companyName && (
              <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                {companyName}
              </p>
            )}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Round #</label>
              <input
                type="number"
                min="1"
                max="10"
                className="input-field"
                value={roundNumber}
                onChange={(e) => setRoundNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="input-label">Round Type</label>
              <select
                className="input-field"
                value={interviewType}
                onChange={(e) => {
                  setInterviewType(e.target.value);
                  const selected = interviewTypes.find(t => t.value === e.target.value);
                  if (selected) setTitle(`${selected.label} Round ${roundNumber}`);
                }}
              >
                {interviewTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Title / Stage Description</label>
            <input
              type="text"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Design with VP of Eng"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Date & Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Duration (min)</label>
              <input
                type="number"
                step="15"
                min="15"
                max="300"
                className="input-field"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Interviewer Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Alex Johnson"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Interviewer Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="alex@company.com"
                value={interviewerEmail}
                onChange={(e) => setInterviewerEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Meeting URL (Google Meet / Zoom / Teams)</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://meet.google.com/abc-def-ghi"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Preparation & Topics Notes</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Key algorithms, past projects to highlight, questions to ask..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Round'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
