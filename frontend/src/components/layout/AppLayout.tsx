'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  TrendingUp,
  CreditCard,
  Calendar,
  Users,
  UserCheck,
  Plus,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { QuickActionModal } from '../modals/QuickActionModal';
import { ScheduleInterviewModal } from '../modals/ScheduleInterviewModal';
import { LogCommunicationModal } from '../modals/LogCommunicationModal';
import { AddReminderModal } from '../modals/AddReminderModal';
import { AddRecruiterModal } from '../modals/AddRecruiterModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isLogCommOpen, setIsLogCommOpen] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [isAddRecruiterOpen, setIsAddRecruiterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('jobtracker_theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      setIsDarkMode(true);
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('jobtracker_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('jobtracker_theme', 'light');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-indigo) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: 'var(--shadow-glow)',
            }}
            className="animate-pulse-glow"
          >
            <Sparkles size={24} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Loading JobTracker...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Applications & Jobs', href: '/applications', icon: Briefcase },
    { label: 'AI Career Copilot', href: '/ai-copilot', icon: Sparkles },
    { label: 'Documents & Resumes', href: '/documents', icon: FileText },
    { label: 'Analytics & Insights', href: '/analytics', icon: TrendingUp },
    { label: 'Calendar & Schedule', href: '/calendar', icon: Calendar },
    { label: 'Recruiters Directory', href: '/recruiters', icon: Users },
    { label: 'Pricing & Plans', href: '/billing', icon: CreditCard },
    { label: 'Profile & Settings', href: '/profile', icon: UserCheck },
  ];

  return (
    <div className="app-layout-wrapper">
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        {/* Brand Header */}
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-indigo) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              JobTracker
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Career Platform
            </span>
          </div>
        </div>

        {/* Quick Add Button */}
        <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.9rem' }}
            onClick={() => setIsQuickActionOpen(true)}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Quick Action</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '0 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.925rem',
                  transition: 'all 0.15s ease',
                  border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.2)' : 'transparent'}`,
                }}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={16} />}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div
          style={{
            padding: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || 'Candidate'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
          </div>
          <button className="btn-ghost" onClick={logout} title="Sign Out" style={{ padding: '0.4rem', color: 'var(--accent-rose)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area (Scrolls independently on desktop) */}
      <div className="app-main-viewport">
        {/* Top Header Bar */}
        <header className="app-top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-ghost show-mobile"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '0.5rem' }}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {navItems.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))?.label || 'Dashboard'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme Switcher */}
            <button
              className="btn-ghost"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-subtle)',
              }}
            >
              {isDarkMode ? <Sun size={18} color="var(--accent-amber)" /> : <Moon size={18} color="var(--accent-indigo)" />}
            </button>

            {/* Quick Action Top Button */}
            <button
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setIsQuickActionOpen(true)}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden-mobile">Add New</span>
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu with Backdrop */}
        {isMobileMenuOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 49,
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div
              className="glass-panel animate-fade-in"
              style={{
                position: 'fixed',
                top: '56px',
                left: 0,
                right: 0,
                zIndex: 50,
                borderRadius: 0,
                borderLeft: 'none',
                borderRight: 'none',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                maxHeight: 'calc(100vh - 140px)',
                overflowY: 'auto',
              }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }} />
              <button
                className="btn-ghost"
                onClick={logout}
                style={{ justifyContent: 'flex-start', color: 'var(--accent-rose)', padding: '0.75rem 1rem' }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}

        {/* Main Body */}
        <main className="mobile-page-container">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav">
          {[
            { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Jobs', href: '/applications', icon: Briefcase },
            { label: 'AI Copilot', href: '/ai-copilot', icon: Sparkles },
            { label: 'Analytics', href: '/analytics', icon: TrendingUp },
            { label: 'Plans', href: '/billing', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.35rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 800 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global Modals */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onOpenScheduleInterview={() => setIsScheduleOpen(true)}
        onOpenLogCommunication={() => setIsLogCommOpen(true)}
        onOpenAddReminder={() => setIsAddReminderOpen(true)}
        onOpenAddRecruiter={() => setIsAddRecruiterOpen(true)}
      />

      <ScheduleInterviewModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />

      <LogCommunicationModal
        isOpen={isLogCommOpen}
        onClose={() => setIsLogCommOpen(false)}
      />

      <AddReminderModal
        isOpen={isAddReminderOpen}
        onClose={() => setIsAddReminderOpen(false)}
      />

      <AddRecruiterModal
        isOpen={isAddRecruiterOpen}
        onClose={() => setIsAddRecruiterOpen(false)}
      />
    </div>
  );
}
