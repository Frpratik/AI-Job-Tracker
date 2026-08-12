'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api, tokenStorage } from '@/lib/api';
import { DocumentItem } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Star,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  FileCode,
  FileCheck,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('resume');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Preview Modal
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await api.get<{ results: DocumentItem[] }>('/documents/');
      setDocuments(res.results || []);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!docTitle) {
        // Auto-fill title from filename without extension
        const name = f.name.replace(/\.[^/.]+$/, '');
        setDocTitle(name);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!docTitle.trim()) {
      setDocTitle(selectedFile.name);
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', docTitle.trim() || selectedFile.name);
      formData.append('doc_type', docType);
      if (docType === 'resume') {
        formData.append('is_primary', isPrimary ? 'true' : 'false');
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
      const access = tokenStorage.getAccess();

      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || errData?.detail || 'Failed to upload document');
      }

      setIsUploadOpen(false);
      setSelectedFile(null);
      setDocTitle('');
      setIsPrimary(false);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimary = async (docId: string) => {
    try {
      await api.post(`/documents/${docId}/set_primary/`);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to set primary resume');
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.delete(`/documents/${docId}/`);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const filtered = documents.filter((d) => {
    if (filterType === 'all') return true;
    return d.doc_type === filterType;
  });

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'resume':
        return FileText;
      case 'cover_letter':
        return FileCheck;
      case 'portfolio':
        return FileCode;
      default:
        return FileSpreadsheet;
    }
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Documents & Resumes
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Store, version, preview, and link master and tailored resumes to applications
            </p>
          </div>

          <button className="btn-primary" onClick={() => setIsUploadOpen(true)}>
            <Upload size={16} /> Upload Document / Resume
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All Documents (${documents.length})` },
            { key: 'resume', label: `Resumes (${documents.filter(d => d.doc_type === 'resume').length})` },
            { key: 'cover_letter', label: `Cover Letters (${documents.filter(d => d.doc_type === 'cover_letter').length})` },
            { key: 'portfolio', label: `Portfolios (${documents.filter(d => d.doc_type === 'portfolio').length})` },
            { key: 'certificate', label: `Certificates (${documents.filter(d => d.doc_type === 'certificate').length})` },
          ].map((tab) => {
            const isSelected = filterType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
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
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            Loading documents...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card glass-panel" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <FileText size={48} color="var(--text-subtle)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No documents in this category
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              Upload master resumes, tailored cover letters, or portfolio samples.
            </p>
            <button className="btn-primary" onClick={() => setIsUploadOpen(true)}>
              <Upload size={16} /> Upload First Resume
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {filtered.map((doc) => {
              const Icon = getDocTypeIcon(doc.doc_type);

              return (
                <div
                  key={doc.id}
                  className="card glass-panel"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    border: doc.is_primary ? '1px solid rgba(16, 185, 129, 0.4)' : undefined,
                    backgroundColor: doc.is_primary ? 'rgba(16, 185, 129, 0.04)' : undefined,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: doc.is_primary ? 'var(--primary)' : 'var(--primary-light)',
                            color: doc.is_primary ? '#ffffff' : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={20} />
                        </div>
                        <div>
                          <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                            {doc.doc_type_label}
                          </span>
                          {doc.is_primary && (
                            <span className="badge badge-emerald" style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>
                              <Star size={10} fill="currentColor" /> Primary Resume
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        className="btn-ghost"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        style={{ color: 'var(--accent-rose)', padding: '0.4rem' }}
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                      {doc.title}
                    </h4>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                      <span>Size: {doc.formatted_file_size}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>

                    {doc.application_company && (
                      <div style={{ marginTop: '0.65rem', padding: '0.4rem 0.65rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-main)', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                        Tailored for: <strong style={{ color: 'var(--text-main)' }}>{doc.application_title} at {doc.application_company}</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    {doc.file_url && (
                      <button
                        className="btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye size={14} /> Preview
                      </button>
                    )}

                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                      >
                        <Download size={14} /> Download
                      </a>
                    )}

                    {doc.doc_type === 'resume' && !doc.is_primary && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem', color: 'var(--primary)' }}
                        onClick={() => handleSetPrimary(doc.id)}
                      >
                        <Star size={14} /> Make Primary
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {isUploadOpen && (
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
            onClick={() => setIsUploadOpen(false)}
          >
            <div
              className="glass-panel animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '520px',
                padding: '2rem',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upload Resume / Document</h3>
                <button className="btn-ghost" onClick={() => setIsUploadOpen(false)} style={{ padding: '0.4rem' }}>
                  <X size={20} />
                </button>
              </div>

              {uploadError && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-rose-light)', color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 500 }}>
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* Drag & Drop File Selector */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-hover)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.txt,.rtf"
                    style={{ display: 'none' }}
                  />
                  <Upload size={36} color="var(--primary)" style={{ margin: '0 auto 0.75rem auto' }} />
                  {selectedFile ? (
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {selectedFile.name}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose another file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                        Click to upload or drag & drop file
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        PDF, DOCX, DOC up to 15MB
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="input-label">Document Title</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Senior Software Engineer Master Resume"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="input-label">Document Category</label>
                    <select
                      className="input-field"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      <option value="resume">Resume / CV</option>
                      <option value="cover_letter">Cover Letter</option>
                      <option value="portfolio">Portfolio / Sample</option>
                      <option value="certificate">Certificate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {docType === 'resume' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.6rem' }}>
                      <input
                        type="checkbox"
                        id="primaryCheck"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <label htmlFor="primaryCheck" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                        Set as Primary Resume
                      </label>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isUploading || !selectedFile}>
                    {isUploading ? 'Uploading...' : 'Save & Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-Browser PDF Preview Modal */}
        {previewDoc && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
            }}
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="glass-panel animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '960px',
                height: '92vh',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{previewDoc.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {previewDoc.doc_type_label} • {previewDoc.formatted_file_size}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {previewDoc.file_url && (
                    <a
                      href={previewDoc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <ExternalLink size={14} /> Open in New Tab
                    </a>
                  )}
                  <button className="btn-ghost" onClick={() => setPreviewDoc(null)} style={{ padding: '0.4rem' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* PDF Preview Content Frame */}
              <div style={{ flex: 1, backgroundColor: '#1e293b', position: 'relative' }}>
                {previewDoc.file_url ? (
                  <iframe
                    src={previewDoc.file_url}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={previewDoc.title}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                    Preview not available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
