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
