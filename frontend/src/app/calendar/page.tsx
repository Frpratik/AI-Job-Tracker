'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CalendarEvent } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScheduleInterviewModal } from '@/components/modals/ScheduleInterviewModal';
import { AddReminderModal } from '@/components/modals/AddReminderModal';
import {
  Calendar as CalendarIcon,
  Video,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<'all' | 'interview' | 'reminder'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await api.get<{ events: CalendarEvent[] }>('/calendar/');
      setEvents(res.events || []);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleToggleReminder = async (remId: string) => {
    try {
      await api.post(`/reminders/${remId}/toggle/`);
      fetchEvents();
    } catch {
      // Ignore
    }
  };

  // Generate 28 dates starting from 7 days ago
  const dateStrip: Date[] = [];
  const startDay = new Date();
  startDay.setDate(startDay.getDate() - 3);

  for (let i = 0; i < 28; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    dateStrip.push(d);
  }

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const filteredEvents = events.filter((e) => {
    if (filterType !== 'all' && e.event_type !== filterType) return false;
    // Check if event belongs to selectedDate or show all if desired
    const eventDate = new Date(e.date_time);
    return isSameDay(eventDate, selectedDate);
  });

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Schedule & Calendar
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Track upcoming interviews, follow-ups, and milestone deadlines
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setIsAddReminderOpen(true)}>
              <Plus size={16} /> New Reminder
            </button>
            <button className="btn-primary" onClick={() => setIsScheduleOpen(true)}>
              <Plus size={16} /> Schedule Interview
            </button>
          </div>
        </div>

        {/* 28-Day Date Selector Strip */}
        <div className="card glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              className="btn-ghost"
              style={{ fontSize: '0.85rem' }}
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {dateStrip.map((d, i) => {
              const isSelected = isSameDay(d, selectedDate);
              const isToday = isSameDay(d, new Date());
              const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
              const dayNum = d.getDate();
              const hasEvents = events.some((ev) => isSameDay(new Date(ev.date_time), d));

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '60px',
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected
                      ? 'var(--primary)'
                      : isToday
                      ? 'var(--primary-light)'
                      : 'var(--bg-main)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : isToday ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? '#ffffff' : 'var(--text-muted)' }}>
                    {dayName}
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.2rem' }}>
                    {dayNum}
                  </span>
                  {hasEvents && (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#ffffff' : 'var(--primary)',
                        marginTop: '0.3rem',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'all', label: 'All Events' },
            { key: 'interview', label: 'Interviews Only' },
            { key: 'reminder', label: 'Reminders Only' },
          ].map((f) => {
            const isSelected = filterType === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key as any)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                  color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Selected Date Agenda List */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem' }}>
            Events for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Loading schedule...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="card glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <CalendarIcon size={40} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>No events scheduled for this day</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Pick another date on the strip or schedule a round.
              </p>
              <button className="btn-primary" onClick={() => setIsScheduleOpen(true)}>
                <Plus size={16} /> Schedule an Event
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredEvents.map((ev) => {
                const dt = new Date(ev.date_time);
                const isInterview = ev.event_type === 'interview';

                return (
                  <div
                    key={ev.id}
                    className="card glass-panel"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      padding: '1.25rem 1.5rem',
                      gap: '1rem',
                      borderLeft: `4px solid ${isInterview ? 'var(--primary)' : 'var(--accent-amber)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: isInterview ? 'var(--primary-light)' : 'var(--accent-amber-light)',
                          color: isInterview ? 'var(--primary)' : 'var(--accent-amber)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isInterview ? <Video size={22} /> : <Clock size={22} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span className={`badge ${isInterview ? 'badge-emerald' : 'badge-amber'}`}>
                            {isInterview ? 'INTERVIEW' : 'REMINDER'}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {ev.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {ev.subtitle}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {isInterview && ev.meeting_url && (
                        <a
                          href={ev.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          <Video size={16} /> Join Call
                        </a>
                      )}

                      {!isInterview && (
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => handleToggleReminder(ev.id)}
                        >
                          <CheckCircle2 size={16} color="var(--primary)" /> Mark Done
                        </button>
                      )}

                      {ev.application_id && (
                        <Link
                          href={`/applications/${ev.application_id}`}
                          className="btn-ghost"
                          style={{ padding: '0.5rem' }}
                        >
                          <ArrowRight size={18} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ScheduleInterviewModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={fetchEvents}
      />

      <AddReminderModal
        isOpen={isAddReminderOpen}
        onClose={() => setIsAddReminderOpen(false)}
        onSuccess={fetchEvents}
      />
    </AppLayout>
  );
}
