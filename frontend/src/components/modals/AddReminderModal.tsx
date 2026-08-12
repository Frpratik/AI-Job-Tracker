'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, Clock, Zap } from 'lucide-react';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  onSuccess?: () => void;
}

export function AddReminderModal({
  isOpen,
  onClose,
  applicationId,
  onSuccess,
}: AddReminderModalProps) {
  const [title, setTitle] = useState('');
  const [reminderType, setReminderType] = useState('follow_up');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const setPreset = (daysFromNow: number, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    // Format YYYY-MM-DDTHH:mm
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setDueAt(localISOTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Please provide a title for the reminder.');
      return;
    }
    if (!dueAt) {
      setError('Please select a due date and time.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/reminders/', {
        application_id: applicationId || null,
        title,
        reminder_type: reminderType,
        due_at: new Date(dueAt).toISOString(),
        notes,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create reminder');
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add Actionable Reminder</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Never miss a follow-up or preparation task</p>
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
          {/* Quick Presets */}
          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Zap size={14} color="var(--accent-amber)" /> Quick Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setPreset(1, 10)}
              >
                Tomorrow 10 AM
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setPreset(3, 11)}
              >
                In 3 Days
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setPreset(7, 10)}
              >
                Next Week
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">Task / Reminder Title</label>
            <input
              type="text"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up on second round feedback"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="input-label">Category</label>
              <select
                className="input-field"
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value)}
              >
                <option value="follow_up">Recruiter Follow-up</option>
                <option value="interview">Interview Preparation</option>
                <option value="deadline">Take-Home Deadline</option>
                <option value="custom">Custom Task</option>
              </select>
            </div>
            <div>
              <label className="input-label">Due Date & Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">Notes</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Add key talking points or checklist items..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
