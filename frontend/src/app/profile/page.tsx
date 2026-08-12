'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  User,
  Mail,
  Compass,
  MapPin,
  Award,
  Laptop,
  Moon,
  Sun,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, completeOnboarding, logout } = useAuth();

  const [targetRole, setTargetRole] = useState(user?.profile?.target_role || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.profile?.experience_level || 'senior');
  const [workPreference, setWorkPreference] = useState(user?.profile?.work_preference || 'remote');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await completeOnboarding({
        target_role: targetRole,
        preferred_locations: user?.profile?.preferred_locations || ['Remote'],
        experience_level: experienceLevel,
        work_preference: workPreference,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // Ignore
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Header */}
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Profile & Career Preferences
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage your account settings and target role calibration
          </p>
        </div>

        {/* User Identity Card */}
        <div className="card glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.5rem',
                border: '2px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {user?.full_name}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className="badge badge-emerald">Verified Account</span>
                <span className="badge badge-indigo">Candidate Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Career Preferences Form */}
        <div className="card glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Target Career Goals
          </h3>

          {savedSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                marginBottom: '1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} /> Preferences updated successfully!
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label className="input-label">Target Role</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  required
                />
                <Compass
                  size={18}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="input-label">Seniority / Experience Level</label>
                <select
                  className="input-field"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="entry">Entry Level (0-2 yrs)</option>
                  <option value="mid">Mid Level (3-5 yrs)</option>
                  <option value="senior">Senior Level (5-8 yrs)</option>
                  <option value="lead">Staff / Lead (8+ yrs)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Work Style Preference</label>
                <select
                  className="input-field"
                  value={workPreference}
                  onChange={(e) => setWorkPreference(e.target.value)}
                >
                  <option value="remote">Remote First</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* Sign Out Card */}
        <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
              Sign Out of Session
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              End your active session on this device
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={logout}
            style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
