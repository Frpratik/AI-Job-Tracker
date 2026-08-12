'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, ArrowRight, ArrowLeft, Check, Compass, MapPin, Award, Laptop } from 'lucide-react';

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState(user?.profile?.target_role || 'Senior Full-Stack Engineer');
  const [locations, setLocations] = useState<string[]>(user?.profile?.preferred_locations || ['Remote']);
  const [experienceLevel, setExperienceLevel] = useState(user?.profile?.experience_level || 'senior');
  const [workPreference, setWorkPreference] = useState(user?.profile?.work_preference || 'remote');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    'Senior Full-Stack Engineer',
    'Senior Frontend Engineer',
    'Backend Engineer',
    'Staff / Lead Engineer',
    'Product Manager',
    'DevOps / Cloud Architect',
    'Mobile Engineer (React Native / Flutter)',
    'Data Scientist / AI Engineer',
  ];

  const popularLocations = [
    'Remote (US / Global)',
    'San Francisco Bay Area',
    'New York, NY',
    'Seattle, WA',
    'London, UK',
    'Toronto, Canada',
    'Berlin, Germany',
    'Bangalore, India',
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level', desc: '0 - 2 years of professional experience' },
    { value: 'mid', label: 'Mid Level', desc: '3 - 5 years of proven industry work' },
    { value: 'senior', label: 'Senior Level', desc: '5 - 8 years with system ownership' },
    { value: 'lead', label: 'Lead / Staff', desc: '8+ years leading architecture and teams' },
  ];

  const workPreferences = [
    { value: 'remote', label: 'Remote First', desc: '100% work from anywhere' },
    { value: 'hybrid', label: 'Hybrid', desc: '1-3 days in office flexibility' },
    { value: 'onsite', label: 'On-site', desc: 'Full-time in office collaboration' },
  ];

  const toggleLocation = (loc: string) => {
    if (locations.includes(loc)) {
      if (locations.length > 1) {
        setLocations(locations.filter((l) => l !== loc));
      }
    } else {
      setLocations([...locations, loc]);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        target_role: targetRole,
        preferred_locations: locations,
        experience_level: experienceLevel,
        work_preference: workPreference,
      });
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '2.5rem',
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: '32px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i <= step ? 'var(--primary)' : 'var(--bg-subtle)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Step {step} of 4
          </span>
        </div>

        {/* Step 1: Target Role */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Compass size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>What role are you targeting?</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              This helps customize your hiring pipeline and dashboard metrics.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {roles.map((r) => {
                const isSelected = targetRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTargetRole(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.9rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{r}</span>
                    {isSelected && <Check size={18} />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setStep(2)}>
                Next: Locations <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preferred Locations */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <MapPin size={24} color="var(--accent-indigo)" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Preferred Locations</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Select all regions you are open to working in.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {popularLocations.map((loc) => {
                const isSelected = locations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--accent-indigo-light)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                      color: isSelected ? 'var(--accent-indigo)' : 'var(--text-main)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>{loc}</span>
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn-primary" onClick={() => setStep(3)}>
                Next: Experience <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Experience Level */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Award size={24} color="var(--accent-amber)" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Experience Level</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Choose your seniority level for salary estimation and round calibration.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {experienceLevels.map((lvl) => {
                const isSelected = experienceLevel === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setExperienceLevel(lvl.value)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--accent-amber-light)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--accent-amber)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: isSelected ? 'var(--accent-amber)' : 'var(--text-main)', fontSize: '0.95rem' }}>
                        {lvl.label}
                      </span>
                      {isSelected && <Check size={18} color="var(--accent-amber)" />}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lvl.desc}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn-primary" onClick={() => setStep(4)}>
                Next: Work Mode <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Work Mode Preference */}
        {step === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Laptop size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Work Style Preference</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              How do you prefer to collaborate day-to-day?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {workPreferences.map((pref) => {
                const isSelected = workPreference === pref.value;
                return (
                  <button
                    key={pref.value}
                    type="button"
                    onClick={() => setWorkPreference(pref.value)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-main)', fontSize: '0.95rem' }}>
                        {pref.label}
                      </span>
                      {isSelected && <Check size={18} color="var(--primary)" />}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pref.desc}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={() => setStep(3)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn-primary" onClick={handleFinish} disabled={isSubmitting}>
                {isSubmitting ? 'Finalizing...' : 'Complete & Launch Dashboard'} <Sparkles size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
