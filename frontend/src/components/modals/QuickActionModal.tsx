'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Bookmark,
  Calendar,
  PhoneCall,
  BellRing,
  UserPlus,
  X,
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleInterview?: () => void;
  onOpenLogCommunication?: () => void;
  onOpenAddReminder?: () => void;
  onOpenAddRecruiter?: () => void;
}

export function QuickActionModal({
  isOpen,
  onClose,
  onOpenScheduleInterview,
  onOpenLogCommunication,
  onOpenAddReminder,
  onOpenAddRecruiter,
}: QuickActionModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Track Active Application',
      desc: 'Add a job you have applied for to your pipeline',
      icon: Briefcase,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
      onClick: () => {
        onClose();
        router.push('/applications/new');
      },
    },
    {
      title: 'Save Job to Wishlist',
      desc: 'Bookmark a role to apply later with 1-tap conversion',
      icon: Bookmark,
      color: 'var(--accent-purple)',
      bg: 'var(--accent-purple-light)',
      onClick: () => {
        onClose();
        router.push('/applications/new?wishlist=true');
      },
    },
    {
      title: 'Schedule Interview Round',
      desc: 'Add upcoming technical, behavioral, or recruiter screen',
      icon: Calendar,
      color: 'var(--accent-amber)',
      bg: 'var(--accent-amber-light)',
      onClick: () => {
        onClose();
        if (onOpenScheduleInterview) onOpenScheduleInterview();
        else router.push('/calendar');
      },
    },
    {
      title: 'Log Recruiter Interaction',
      desc: 'Record email, phone call, LinkedIn DM, or interview prep',
      icon: PhoneCall,
      color: 'var(--accent-blue)',
      bg: 'var(--accent-blue-light)',
      onClick: () => {
        onClose();
        if (onOpenLogCommunication) onOpenLogCommunication();
        else router.push('/applications');
      },
    },
    {
      title: 'Create Actionable Reminder',
      desc: 'Set follow-up alert or deadline reminder',
      icon: BellRing,
      color: 'var(--accent-rose)',
      bg: 'var(--accent-rose-light)',
      onClick: () => {
        onClose();
        if (onOpenAddReminder) onOpenAddReminder();
        else router.push('/calendar');
      },
    },
    {
      title: 'Add Recruiter Contact',
      desc: 'Store talent partner info and LinkedIn profile',
      icon: UserPlus,
      color: 'var(--accent-indigo)',
      bg: 'var(--accent-indigo-light)',
      onClick: () => {
        onClose();
        if (onOpenAddRecruiter) onOpenAddRecruiter();
        else router.push('/recruiters');
      },
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 999,
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
          maxWidth: '560px',
          padding: '1.75rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Quick Actions</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>What would you like to track or schedule?</p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.875rem' }}>
          {actions.map((act, i) => {
            const Icon = act.icon;
            return (
              <button
                key={i}
                onClick={act.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = act.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: act.bg,
                    color: act.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    {act.title}
                  </h4>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    {act.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
