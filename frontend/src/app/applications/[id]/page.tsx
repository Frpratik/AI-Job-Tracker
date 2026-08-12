'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Application, Interview, Communication, Recruiter, Reminder } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScheduleInterviewModal } from '@/components/modals/ScheduleInterviewModal';
import { LogCommunicationModal } from '@/components/modals/LogCommunicationModal';
import { AddReminderModal } from '@/components/modals/AddReminderModal';
import { AddRecruiterModal } from '@/components/modals/AddRecruiterModal';
import {
  Briefcase,
  Building,
  MapPin,
  Calendar,
  PhoneCall,
  Mail,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Plus,
  Send,
  Trash2,
  Edit3,
  Bookmark,
  MessageSquare,
  Sparkles,
  Award,
  FileText,
  Upload,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const appId = resolvedParams.id;
  const router = useRouter();

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'interviews' | 'communications' | 'recruiters' | 'notes'>('overview');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isLogCommModalOpen, setIsLogCommModalOpen] = useState(false);
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [isAddRecruiterModalOpen, setIsAddRecruiterModalOpen] = useState(false);

  // Note composer
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchApplication = async () => {
    try {
      const res = await api.get<Application>(`/applications/${appId}/`);
      setApplication(res);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [appId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await api.patch<Application>(`/applications/${appId}/status/`, {
        status: newStatus,
      });
      setApplication(updated);
      if (newStatus === 'offer' || newStatus === 'accepted') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConvertWishlist = async () => {
    try {
      await api.post(`/applications/${appId}/convert/`);
      await fetchApplication();
    } catch (err: any) {
      alert(err.message || 'Failed to convert wishlist');
    }
  };

  const handleToggleReminder = async (remId: string) => {
    try {
      await api.post(`/reminders/${remId}/toggle/`);
      fetchApplication();
    } catch {
      // Ignore
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSavingNote(true);
    try {
      await api.post(`/applications/${appId}/notes/`, {
        body: newNote.trim(),
        is_important: false,
      });
      setNewNote('');
      await fetchApplication();
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this application from your board?')) return;
    try {
      await api.delete(`/applications/${appId}/`);
      router.push('/applications');
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
          Loading application details...
        </div>
      </AppLayout>
    );
  }

  if (!application) {
    return (
      <AppLayout>
        <div className="card glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>Application not found</h3>
          <Link href="/applications" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            Back to Applications
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isWishlist = application.status === 'wishlist';

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Back Link */}
        <Link
          href="/applications"
          className="btn-ghost"
          style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Pipeline
        </Link>

        {/* Top Hero Application Card */}
        <div className="card glass-panel" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: isWishlist ? 'var(--accent-purple-light)' : 'var(--primary-light)',
                  color: isWishlist ? 'var(--accent-purple)' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  border: `1px solid ${isWishlist ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {application.job?.company?.name?.charAt(0).toUpperCase() || 'J'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {application.job?.title}
                  </h2>
                  {isWishlist && (
                    <span className="badge badge-purple">
                      <Bookmark size={12} /> Wishlist
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {application.job?.company?.name}
                  </span>
                  {application.job?.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
                      <MapPin size={14} /> {application.job.location}
                    </span>
                  )}
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    {application.job?.work_mode}
                  </span>
                  {application.job?.url && (
                    <a
                      href={application.job.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}
                    >
                      <ExternalLink size={14} /> View Posting
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status Dropdown & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {isWishlist ? (
                <button
                  className="btn-primary"
                  onClick={handleConvertWishlist}
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <Send size={16} /> Convert to Applied
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Status:
                  </span>
                  <select
                    className="input-field"
                    style={{ width: 'auto', fontWeight: 700, padding: '0.5rem 0.85rem' }}
                    value={application.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="applied">Applied</option>
                    <option value="screening">Screening</option>
                    <option value="assessment">Take-Home / Assessment</option>
                    <option value="technical_interview">Technical Round</option>
                    <option value="hr_interview">HR Interview</option>
                    <option value="final_interview">Final Interview</option>
                    <option value="offer">🎉 Offer Received</option>
                    <option value="accepted">Accepted Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              )}

              <Link
                href={`/ai-copilot?tab=ats&application_id=${appId}`}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                title="Run AI ATS Scan"
              >
                <Sparkles size={14} color="var(--accent-indigo)" /> AI Match Scan
              </Link>

              <Link
                href={`/ai-copilot?tab=interview_prep&application_id=${appId}`}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                title="AI Mock Interview Prep"
              >
                <Award size={14} color="var(--primary)" /> AI Interview Prep
              </Link>

              <button
                className="btn-ghost"
                onClick={handleDelete}
                title="Delete Application"
                style={{ color: 'var(--accent-rose)', padding: '0.6rem' }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            gap: '0.5rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {[
            { key: 'overview', label: 'Overview & Timeline', count: null },
            { key: 'documents', label: 'Resumes & Docs', count: application.documents?.length || 0 },
            { key: 'interviews', label: 'Interviews', count: application.interviews?.length || 0 },
            { key: 'communications', label: 'Activity Log', count: application.communications?.length || 0 },
            { key: 'recruiters', label: 'Recruiters & Contacts', count: application.primary_recruiter ? 1 : 0 },
            { key: 'notes', label: 'Tasks & Notes', count: (application.reminders?.length || 0) + (application.notes?.length || 0) },
          ].map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.925rem',
                  borderBottom: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{t.label}</span>
                {t.count !== null && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      color: isActive ? 'var(--primary)' : 'var(--text-subtle)',
                      fontWeight: 700,
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview & Milestones */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Key Facts */}
            <div className="card glass-panel">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Application Parameters
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Discovery Source</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{application.source || 'Direct'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Priority Level</span>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', color: application.priority === 'high' ? 'var(--accent-rose)' : 'var(--primary)' }}>
                    {application.priority}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Applied Date</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {application.applied_date ? new Date(application.applied_date).toLocaleDateString() : 'Not applied yet'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Employment Type</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Full Time</span>
                </div>
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="card glass-panel">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Status Progression Milestones
              </h3>
              {application.status_history && application.status_history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {application.status_history.map((hist, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <CheckCircle2 size={15} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-main)' }}>
                            {hist.to_status_label || hist.to_status}
                          </span>
                          <span style={{ fontSize: '0.775rem', color: 'var(--text-subtle)' }}>
                            {new Date(hist.changed_at).toLocaleDateString()}
                          </span>
                        </div>
                        {hist.from_status && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Transitioned from {hist.from_status_label || hist.from_status}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No status changes recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Resumes & Documents */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Resumes & Documents for this Application ({application.documents?.length || 0})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Tailored resumes, cover letters, and work samples submitted to {application.job?.company?.name}
                </p>
              </div>
              <Link href="/documents" className="btn-primary">
                <Upload size={16} /> Manage All Resumes
              </Link>
            </div>

            {application.documents && application.documents.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {application.documents.map((doc) => (
                  <div key={doc.id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span className="badge badge-indigo">{doc.doc_type_label}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.formatted_file_size}</span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        {doc.title}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                        Uploaded {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', justifyContent: 'center' }}>
                          <Download size={14} /> Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <FileText size={40} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>No specific documents attached</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Upload a tailored resume or cover letter for {application.job?.company?.name}.
                </p>
                <Link href="/documents" className="btn-primary" style={{ display: 'inline-flex' }}>
                  <Upload size={16} /> Go to Documents Hub
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Interviews */}
        {activeTab === 'interviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Scheduled Rounds ({application.interviews?.length || 0})
              </h3>
              <button className="btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
                <Plus size={16} /> Schedule Next Round
              </button>
            </div>

            {application.interviews && application.interviews.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {application.interviews.map((round) => {
                  const dt = new Date(round.scheduled_at);
                  return (
                    <div key={round.id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="badge badge-emerald">ROUND {round.round_number}</span>
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {round.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {round.interview_type_label} • {round.duration_minutes} minutes
                        </p>
                      </div>

                      {round.interviewer_name && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>Interviewer:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{round.interviewer_name}</strong>
                        </div>
                      )}

                      {round.notes && (
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-subtle)', backgroundColor: 'var(--bg-main)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                          {round.notes}
                        </p>
                      )}

                      {round.meeting_url && (
                        <a
                          href={round.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                          style={{ marginTop: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          <Video size={16} /> Join Video Meeting
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <Calendar size={40} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>No interviews scheduled</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Schedule technical rounds, screenings, or final loops to keep meeting links in one place.
                </p>
                <button className="btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
                  <Plus size={16} /> Schedule First Round
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Timeline & Communications */}
        {activeTab === 'communications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Interaction Log ({application.communications?.length || 0})
              </h3>
              <button className="btn-primary" onClick={() => setIsLogCommModalOpen(true)}>
                <Plus size={16} /> Log Interaction
              </button>
            </div>

            {application.communications && application.communications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {application.communications.map((comm) => (
                  <div key={comm.id} className="card glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-indigo">{comm.channel_label}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {comm.direction_label}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                        {new Date(comm.contact_date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                      {comm.summary}
                    </h4>

                    {comm.details && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {comm.details}
                      </p>
                    )}

                    {comm.follow_up_date && (
                      <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                        Next Follow-up Scheduled: {new Date(comm.follow_up_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <MessageSquare size={40} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>No interactions logged yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Log recruiter emails, phone conversations, or LinkedIn follow-ups.
                </p>
                <button className="btn-primary" onClick={() => setIsLogCommModalOpen(true)}>
                  <Plus size={16} /> Log First Interaction
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Recruiters & Contacts */}
        {activeTab === 'recruiters' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recruiter Contact</h3>
              <button className="btn-primary" onClick={() => setIsAddRecruiterModalOpen(true)}>
                <Plus size={16} /> {application.primary_recruiter ? 'Change Recruiter' : 'Add Recruiter'}
              </button>
            </div>

            {application.primary_recruiter ? (
              <div className="card glass-panel" style={{ maxWidth: '520px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.3rem',
                    }}
                  >
                    {application.primary_recruiter.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {application.primary_recruiter.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {application.primary_recruiter.company_name || application.job?.company?.name} • Talent Partner
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  {application.primary_recruiter.email && (
                    <a
                      href={`mailto:${application.primary_recruiter.email}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Mail size={14} /> {application.primary_recruiter.email}
                    </a>
                  )}
                  {application.primary_recruiter.phone && (
                    <a
                      href={`tel:${application.primary_recruiter.phone}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <PhoneCall size={14} /> {application.primary_recruiter.phone}
                    </a>
                  )}
                  {application.primary_recruiter.linkedin_url && (
                    <a
                      href={application.primary_recruiter.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '0.85rem', color: 'var(--primary)' }}
                    >
                      <ExternalLink size={14} /> LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="card glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>No recruiter attached</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Save your hiring manager or recruiter info for quick 1-click email and phone access.
                </p>
                <button className="btn-primary" onClick={() => setIsAddRecruiterModalOpen(true)}>
                  <Plus size={16} /> Add Recruiter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Tasks & Notes */}
        {activeTab === 'notes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Reminders List */}
            <div className="card glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Actionable Tasks</h3>
                <button
                  className="btn-primary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => setIsAddReminderModalOpen(true)}
                >
                  <Plus size={14} /> New Task
                </button>
              </div>

              {application.reminders && application.reminders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {application.reminders.map((rem) => (
                    <div
                      key={rem.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rem.is_completed}
                        onChange={() => handleToggleReminder(rem.id)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: rem.is_completed ? 'var(--text-subtle)' : 'var(--text-main)',
                            textDecoration: rem.is_completed ? 'line-through' : 'none',
                          }}
                        >
                          {rem.title}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Due {new Date(rem.due_at).toLocaleDateString()} • {rem.reminder_type_label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active tasks.</p>
              )}
            </div>

            {/* Notes Composer & History */}
            <div className="card glass-panel">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Notes & Observations</h3>

              <form onSubmit={handleAddNote} style={{ marginBottom: '1.25rem' }}>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Record an interview observation, salary detail, or next steps..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  style={{ marginBottom: '0.65rem' }}
                />
                <button type="submit" className="btn-primary" disabled={isSavingNote || !newNote.trim()}>
                  {isSavingNote ? 'Saving...' : 'Add Note'}
                </button>
              </form>

              {application.notes && application.notes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {application.notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {note.body}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.35rem', display: 'block' }}>
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No notes logged yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Embedded Modals */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        applicationId={appId}
        companyName={application.job?.company?.name}
        onSuccess={fetchApplication}
      />

      <LogCommunicationModal
        isOpen={isLogCommModalOpen}
        onClose={() => setIsLogCommModalOpen(false)}
        applicationId={appId}
        recruiterId={application.primary_recruiter?.id}
        onSuccess={fetchApplication}
      />

      <AddReminderModal
        isOpen={isAddReminderModalOpen}
        onClose={() => setIsAddReminderModalOpen(false)}
        applicationId={appId}
        onSuccess={fetchApplication}
      />

      <AddRecruiterModal
        isOpen={isAddRecruiterModalOpen}
        onClose={() => setIsAddRecruiterModalOpen(false)}
        defaultCompany={application.job?.company?.name}
        onSuccess={fetchApplication}
      />
    </AppLayout>
  );
}
