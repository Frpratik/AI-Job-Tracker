'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, tokenStorage } from '@/lib/api';
import {
  Application,
  DocumentItem,
  ATSScanResult,
  CoverLetterResult,
  InterviewPrepResult,
} from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Sparkles,
  FileText,
  FileCheck,
  Award,
  Copy,
  Check,
  Upload,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Bookmark,
  Building,
  Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function AICopilotContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'ats';
  const initialAppId = searchParams.get('application_id') || '';

  const [activeTab, setActiveTab] = useState<'ats' | 'cover_letter' | 'interview_prep'>(
    initialTab as any
  );

  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>(initialAppId);

  // ATS State
  const [atsResumeId, setAtsResumeId] = useState<string>('');
  const [atsJobTitle, setAtsJobTitle] = useState<string>('');
  const [atsJobDescription, setAtsJobDescription] = useState<string>('');
  const [isScanningATS, setIsScanningATS] = useState<boolean>(false);
  const [atsResult, setAtsResult] = useState<ATSScanResult | null>(null);

  // Cover Letter State
  const [clJobTitle, setClJobTitle] = useState<string>('');
  const [clCompany, setClCompany] = useState<string>('');
  const [clJobDescription, setClJobDescription] = useState<string>('');
  const [clTone, setClTone] = useState<string>('professional');
  const [isGeneratingCL, setIsGeneratingCL] = useState<boolean>(false);
  const [clResult, setClResult] = useState<CoverLetterResult | null>(null);
  const [clDraft, setClDraft] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSavingDoc, setIsSavingDoc] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Interview Prep State
  const [ipJobTitle, setIpJobTitle] = useState<string>('');
  const [ipCompany, setIpCompany] = useState<string>('');
  const [ipType, setIpType] = useState<string>('technical');
  const [isGeneratingIP, setIsGeneratingIP] = useState<boolean>(false);
  const [ipResult, setIpResult] = useState<InterviewPrepResult | null>(null);

  useEffect(() => {
    const loadAppData = async () => {
      try {
        const [appsRes, docsRes] = await Promise.all([
          api.get<{ results: Application[] }>('/applications/'),
          api.get<{ results: DocumentItem[] }>('/documents/'),
        ]);
        const apps = appsRes.results || [];
        setApplications(apps);
        const docs = docsRes.results || [];
        setDocuments(docs);

        const primary = docs.find((d) => d.is_primary);
        if (primary) {
          setAtsResumeId(primary.id);
        } else if (docs.length > 0) {
          setAtsResumeId(docs[0].id);
        }

        if (initialAppId) {
          const target = apps.find((a) => a.id === initialAppId);
          if (target) {
            populateFromApp(target);
          }
        }
      } catch {
        // Handle error
      }
    };
    loadAppData();
  }, [initialAppId]);

  const populateFromApp = (app: Application) => {
    setSelectedAppId(app.id);
    const title = app.job?.title || '';
    const company = app.job?.company?.name || '';
    const desc = `${title} at ${company}. Work Mode: ${app.job?.work_mode || ''}. Location: ${app.job?.location || ''}.`;

    setAtsJobTitle(title);
    setAtsJobDescription(desc);

    setClJobTitle(title);
    setClCompany(company);
    setClJobDescription(desc);

    setIpJobTitle(title);
    setIpCompany(company);
  };

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId);
    if (!appId) return;
    const target = applications.find((a) => a.id === appId);
    if (target) {
      populateFromApp(target);
    }
  };

  // 1. Run ATS Scan
  const handleRunATSScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanningATS(true);
    try {
      const res = await api.post<ATSScanResult>('/ai/ats-scan/', {
        resume_id: atsResumeId || undefined,
        application_id: selectedAppId || undefined,
        job_title: atsJobTitle,
        job_description: atsJobDescription,
      });
      setAtsResult(res);
      if (res.score >= 70) {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to analyze resume');
    } finally {
      setIsScanningATS(false);
    }
  };

  // 2. Generate Cover Letter
  const handleGenerateCoverLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingCL(true);
    setSavedSuccess(false);
    try {
      const res = await api.post<CoverLetterResult>('/ai/cover-letter/', {
        job_title: clJobTitle || 'Software Engineer',
        company_name: clCompany || 'Hiring Team',
        job_description: clJobDescription,
        tone: clTone,
        application_id: selectedAppId || undefined,
      });
      setClResult(res);
      setClDraft(res.content);
    } catch (err: any) {
      alert(err.message || 'Failed to generate cover letter');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(clDraft);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveCoverLetterToDocs = async () => {
    if (!clDraft) return;
    setIsSavingDoc(true);
    try {
      const blob = new Blob([clDraft], { type: 'text/plain' });
      const file = new File([blob], `${clCompany || 'Company'}_Cover_Letter.txt`, {
        type: 'text/plain',
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'title',
        `${clCompany ? clCompany + ' - ' : ''}${clJobTitle || 'Role'} Cover Letter`
      );
      formData.append('doc_type', 'cover_letter');
      if (selectedAppId) {
        formData.append('application', selectedAppId);
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
      const access = tokenStorage.getAccess();
      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to save document.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save cover letter');
    } finally {
      setIsSavingDoc(false);
    }
  };

  // 3. Generate Interview Prep
  const handleGenerateInterviewPrep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingIP(true);
    try {
      const res = await api.post<InterviewPrepResult>('/ai/interview-prep/', {
        job_title: ipJobTitle || 'Software Engineer',
        company_name: ipCompany || 'Tech Company',
        interview_type: ipType,
        application_id: selectedAppId || undefined,
      });
      setIpResult(res);
    } catch (err: any) {
      alert(err.message || 'Failed to generate interview questions');
    } finally {
      setIsGeneratingIP(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--accent-indigo) 0%, var(--primary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Sparkles size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                AI Career Copilot
              </h2>
              <span className="badge badge-indigo">INTELLIGENT SUITE</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              ATS Resume Matcher • Custom Cover Letter Studio • Mock Interview Prep Coach
            </p>
          </div>
        </div>

        {/* Quick Link Application Selector */}
        {applications.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Autofill from role:
            </span>
            <select
              className="input-field"
              style={{ width: 'auto', minWidth: '220px', height: '38px', fontSize: '0.825rem' }}
              value={selectedAppId}
              onChange={(e) => handleAppSelect(e.target.value)}
            >
              <option value="">-- Choose active role --</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.job?.company?.name} — {app.job?.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3 Copilot Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-card)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          width: 'fit-content',
          gap: '0.35rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('ats')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: activeTab === 'ats' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'ats' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <FileCheck size={16} /> 1. ATS Resume Scanner
        </button>

        <button
          onClick={() => setActiveTab('cover_letter')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: activeTab === 'cover_letter' ? 'var(--accent-indigo)' : 'transparent',
            color: activeTab === 'cover_letter' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <FileText size={16} /> 2. AI Cover Letter Studio
        </button>

        <button
          onClick={() => setActiveTab('interview_prep')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: activeTab === 'interview_prep' ? 'var(--accent-purple)' : 'transparent',
            color: activeTab === 'interview_prep' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Award size={16} /> 3. Interview Coach & STAR Prep
        </button>
      </div>

      {/* TAB 1: ATS RESUME SCANNER */}
      {activeTab === 'ats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {/* Form */}
          <div className="card glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Scan Resume Against Job Posting
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Compare your resume against target keywords and get actionable optimization tips
            </p>

            <form onSubmit={handleRunATSScan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Select Candidate Resume</label>
                <select
                  className="input-field"
                  value={atsResumeId}
                  onChange={(e) => setAtsResumeId(e.target.value)}
                >
                  {documents.filter(d => d.doc_type === 'resume').map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} {doc.is_primary ? '(Primary Resume)' : ''}
                    </option>
                  ))}
                  {documents.filter(d => d.doc_type === 'resume').length === 0 && (
                    <option value="">Master Profile Resume</option>
                  )}
                </select>
              </div>

              <div>
                <label className="input-label">Target Job Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Senior Backend Engineer"
                  value={atsJobTitle}
                  onChange={(e) => setAtsJobTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Paste Job Description / Requirements</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  placeholder="Paste the job requirements, qualifications, and responsibilities here..."
                  value={atsJobDescription}
                  onChange={(e) => setAtsJobDescription(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isScanningATS}
                style={{ marginTop: '0.5rem' }}
              >
                {isScanningATS ? 'Analyzing with AI...' : 'Run ATS Match Analysis'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="card glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>ATS Compatibility Report</h3>
                {atsResult && (
                  <span className={`badge ${atsResult.score >= 75 ? 'badge-emerald' : atsResult.score >= 55 ? 'badge-amber' : 'badge-rose'}`}>
                    {atsResult.score_label}
                  </span>
                )}
              </div>

              {!atsResult ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                  <FileCheck size={44} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem auto' }} />
                  <p style={{ fontWeight: 600 }}>No scan generated yet</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Select a resume and job description to get your match score</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Score Highlight */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                      {atsResult.score}%
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>ATS Match Score</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Hard Skills Match: <strong>{atsResult.hard_skills_match_pct}%</strong> • Soft Skills: <strong>{atsResult.soft_skills_match_pct}%</strong>
                      </p>
                    </div>
                  </div>

                  {/* Matching Keywords */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      Matching Keywords Detected ({atsResult.matched_keywords.length})
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {atsResult.matched_keywords.map((kw) => (
                        <span key={kw} className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  {atsResult.missing_keywords.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.4rem' }}>
                        Missing Priority Keywords ({atsResult.missing_keywords.length})
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {atsResult.missing_keywords.map((kw) => (
                          <span key={kw} className="badge badge-rose" style={{ fontSize: '0.75rem' }}>
                            + Add {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      Key Optimization Suggestions
                    </h5>
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {atsResult.improvement_suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI COVER LETTER STUDIO */}
      {activeTab === 'cover_letter' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {/* Controls */}
          <div className="card glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Cover Letter Generator
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Draft a customized, high-impact cover letter aligned with company goals
            </p>

            <form onSubmit={handleGenerateCoverLetter} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">Target Role *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={clJobTitle}
                    onChange={(e) => setClJobTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Company Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Stripe"
                    value={clCompany}
                    onChange={(e) => setClCompany(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Writing Tone</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {['professional', 'enthusiastic', 'confident', 'creative'].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setClTone(t)}
                      style={{
                        padding: '0.5rem 0.25rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: clTone === t ? 'var(--accent-indigo)' : 'var(--bg-main)',
                        color: clTone === t ? '#ffffff' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">Role Focus / Key Requirements (Optional)</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '90px', resize: 'vertical' }}
                  placeholder="Paste details about the role or company values to highlight..."
                  value={clJobDescription}
                  onChange={(e) => setClJobDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ backgroundColor: 'var(--accent-indigo)' }}
                disabled={isGeneratingCL}
              >
                {isGeneratingCL ? 'Generating Cover Letter...' : 'Draft Cover Letter with AI'}
              </button>
            </form>
          </div>

          {/* Letter Output & Editor */}
          <div className="card glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Generated Letter Draft</h3>
                {clDraft && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-secondary"
                      onClick={handleCopyCoverLetter}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      {isCopied ? <Check size={14} color="var(--primary)" /> : <Copy size={14} />}
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>

                    <button
                      className="btn-primary"
                      onClick={handleSaveCoverLetterToDocs}
                      disabled={isSavingDoc}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--primary)' }}
                    >
                      <Save size={14} />
                      {savedSuccess ? 'Saved!' : isSavingDoc ? 'Saving...' : 'Save to Docs'}
                    </button>
                  </div>
                )}
              </div>

              {!clDraft ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  <FileText size={44} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem auto' }} />
                  <p style={{ fontWeight: 600 }}>Ready to generate</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Enter company and role details to produce a tailored letter</p>
                </div>
              ) : (
                <textarea
                  className="input-field"
                  style={{
                    minHeight: '340px',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    padding: '1rem',
                  }}
                  value={clDraft}
                  onChange={(e) => setClDraft(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI INTERVIEW COACH */}
      {activeTab === 'interview_prep' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls */}
          <div className="card glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Generate Role-Specific Mock Interview Questions
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Practice with tailored technical, system architecture, and behavioral STAR questions
            </p>

            <form onSubmit={handleGenerateInterviewPrep} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label className="input-label">Target Role</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Principal Architect"
                  value={ipJobTitle}
                  onChange={(e) => setIpJobTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Company Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Netflix"
                  value={ipCompany}
                  onChange={(e) => setIpCompany(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Interview Type</label>
                <select
                  className="input-field"
                  value={ipType}
                  onChange={(e) => setIpType(e.target.value)}
                >
                  <option value="technical">Technical & System Design</option>
                  <option value="behavioral">Behavioral (STAR Method)</option>
                  <option value="screening">HR & Screening Round</option>
                  <option value="leadership">Engineering Leadership</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ backgroundColor: 'var(--accent-purple)', height: '42px' }}
                disabled={isGeneratingIP}
              >
                {isGeneratingIP ? 'Generating...' : 'Generate Questions'}
              </button>
            </form>
          </div>

          {/* Questions Grid */}
          {ipResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Tailored Questions for {ipResult.job_title} at {ipResult.company_name}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {ipResult.questions.map((q) => (
                  <div key={q.id} className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge badge-purple">{q.category}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Question #{q.id}</span>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      "{q.question}"
                    </h4>

                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Why they ask:</strong> {q.why_they_ask}
                    </div>

                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        Key Talking Points:
                      </h5>
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {q.talking_points.map((tp, idx) => (
                          <li key={idx}>{tp}</li>
                        ))}
                      </ul>
                    </div>

                    {q.star_framework && (
                      <div
                        style={{
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '0.75rem',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '0.65rem',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem' }}>
                          <strong style={{ color: 'var(--primary)' }}>Situation:</strong> {q.star_framework.situation}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>
                          <strong style={{ color: 'var(--accent-blue)' }}>Task:</strong> {q.star_framework.task}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>
                          <strong style={{ color: 'var(--accent-indigo)' }}>Action:</strong> {q.star_framework.action}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>
                          <strong style={{ color: 'var(--accent-amber)' }}>Result:</strong> {q.star_framework.result}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AICopilotPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading AI Copilot...</div>}>
        <AICopilotContent />
      </Suspense>
    </AppLayout>
  );
}
