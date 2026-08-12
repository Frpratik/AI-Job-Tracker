export interface Company {
  id?: number;
  name: string;
  website?: string;
  logo_url?: string;
}

export interface Job {
  id?: number;
  company: Company;
  title: string;
  external_id?: string;
  url?: string;
  location: string;
  work_mode: 'remote' | 'hybrid' | 'onsite' | 'unspecified';
  employment_type?: string;
  experience_level?: string;
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  salary_currency?: string;
}

export interface StatusHistoryItem {
  id?: number;
  from_status: string;
  from_status_label: string;
  to_status: string;
  to_status_label: string;
  changed_at: string;
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  notes: string;
  company_id?: number | null;
  company_name?: string | null;
  last_contact_date?: string | null;
  next_follow_up_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Interview {
  id: string;
  application_id: string;
  title: string;
  round_number: number;
  interview_type: string;
  interview_type_label: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  status_label: string;
  scheduled_at: string;
  duration_minutes: number;
  interviewer_name: string;
  interviewer_email: string;
  meeting_url: string;
  location: string;
  notes: string;
  feedback: string;
  company_name?: string;
  job_title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Communication {
  id: string;
  application_id: string;
  recruiter_id?: string | null;
  recruiter_name?: string | null;
  channel: 'email' | 'phone_call' | 'linkedin' | 'whatsapp' | 'video_call' | 'in_person' | 'other';
  channel_label: string;
  direction: 'outbound' | 'inbound';
  direction_label: string;
  summary: string;
  details: string;
  contact_date: string;
  follow_up_date?: string | null;
  created_at?: string;
}

export interface Reminder {
  id: string;
  application_id?: string | null;
  interview_id?: string | null;
  title: string;
  reminder_type: 'follow_up' | 'interview' | 'deadline' | 'custom';
  reminder_type_label: string;
  due_at: string;
  is_completed: boolean;
  completed_at?: string | null;
  notes: string;
  company_name?: string;
  job_title?: string;
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  event_type: 'interview' | 'reminder';
  title: string;
  subtitle: string;
  date_time: string;
  meeting_url?: string;
  is_completed?: boolean;
  application_id?: string | null;
  company_name?: string;
  job_title?: string;
  duration_minutes?: number;
  status?: string;
  reminder_type?: string;
}

export interface DocumentItem {
  id: string;
  application?: string | null;
  application_company?: string | null;
  application_title?: string | null;
  title: string;
  doc_type: 'resume' | 'cover_letter' | 'portfolio' | 'certificate' | 'other';
  doc_type_label: string;
  file: string;
  file_url?: string;
  file_size_bytes: number;
  formatted_file_size: string;
  mime_type: string;
  is_primary: boolean;
  version_number: number;
  parsed_text?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  body: string;
  is_important: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Application {
  id: string;
  job: Job;
  status: string;
  status_label: string;
  applied_date: string | null;
  source: string;
  priority: 'low' | 'medium' | 'high';
  priority_label: string;
  is_archived: boolean;
  primary_recruiter?: Recruiter | null;
  primary_recruiter_id?: string | null;
  tags?: Tag[];
  notes?: Note[];
  interviews?: Interview[];
  communications?: Communication[];
  reminders?: Reminder[];
  documents?: DocumentItem[];
  status_history?: StatusHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  target_role: string;
  preferred_locations: string[];
  experience_level: string;
  work_preference: string;
  onboarding_completed: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_email_verified: boolean;
  profile: Profile;
  created_at: string;
}

export interface DashboardData {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  rejected: number;
  saved_jobs: number;
  funnel: Record<string, number>;
  upcoming_interviews: Interview[];
  pending_reminders: Reminder[];
  recent: Application[];
}

export interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
}

export interface SourceRoiItem {
  source: string;
  total_applications: number;
  interviews: number;
  offers: number;
  conversion_rate_pct: number;
}

export interface WeeklyActivityItem {
  week_label: string;
  count: number;
}

export interface AnalyticsData {
  timeframe: string;
  summary: {
    total_tracked: number;
    applied_count: number;
    wishlist_count: number;
    screening_count: number;
    interview_count: number;
    offer_count: number;
    accepted_count: number;
    rejected_count: number;
    withdrawn_count: number;
  };
  rates: {
    interview_rate_pct: number;
    offer_rate_pct: number;
    interview_to_offer_pct: number;
    avg_response_days: number;
  };
  funnel: FunnelStage[];
  source_roi: SourceRoiItem[];
  compensation: {
    avg_salary_min: number;
    avg_salary_max: number;
    work_mode_distribution: Record<string, number>;
  };
  weekly_activity: WeeklyActivityItem[];
}

export interface ATSScanResult {
  score: number;
  score_label: string;
  matched_keywords: string[];
  missing_keywords: string[];
  hard_skills_match_pct: number;
  soft_skills_match_pct: number;
  strengths: string[];
  improvement_suggestions: string[];
}

export interface CoverLetterResult {
  job_title: string;
  company_name: string;
  tone: string;
  content: string;
}

export interface StarFramework {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface InterviewQuestion {
  id: number;
  category: string;
  question: string;
  why_they_ask: string;
  talking_points: string[];
  star_framework: StarFramework;
}

export interface InterviewPrepResult {
  job_title: string;
  company_name: string;
  interview_type: string;
  total_questions: number;
  questions: InterviewQuestion[];
}

export interface Subscription {
  id: string;
  plan: 'free' | 'pro_monthly' | 'pro_yearly';
  plan_label: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  status_label: string;
  is_pro: boolean;
  ai_scans_used_this_month: number;
  cover_letters_used_this_month: number;
  max_applications: number | null;
  max_ai_scans: number | null;
  max_cover_letters: number | null;
  max_resumes: number | null;
  current_application_count: number;
  current_resume_count: number;
  current_period_end?: string | null;
  created_at?: string;
  updated_at?: string;
}
