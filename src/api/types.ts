// API Types for Psydia

// Auth
export interface AuthRequest {
  init_data: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  telegram_id: number;
  display_name: string;
  avatar_id: number;
  theme: 'light' | 'dark';
  streak_current: number;
  streak_best: number;
  total_answered: number;
  created_at: string;
}

// Navigation
export interface Subject {
  id: string;
  name: string;
  icon_emoji: string;
  topic_count: number;
  order: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  subtopic_count: number;
  order: number;
}

export interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  question_count: number;
  order: number;
}

// Subtopic Overview
export type StatusLabel = 'beginner' | 'in_progress' | 'almost' | 'mastered';

export interface SubtopicOverview {
  subtopic_id: string;
  subtopic_name: string;
  topic_name: string;
  subject_name: string;
  status_label: StatusLabel;
  due_count: number;
  weak_count: number;
  new_count: number;
  has_sufficient_data: boolean;
  total_answered: number;
  accuracy_percent: number | null;
  last_session_at: string | null;
}

// Session
export type SessionMode = 
  | 'daily_mix' 
  | 'due_only' 
  | 'weak_first' 
  | 'new_only' 
  | 'bookmarks' 
  | 'review_free';

export interface CreateSessionRequest {
  subtopic_id: string;
  mode: SessionMode;
  size: 10 | 20 | 30;
}

export interface SessionQuestion {
  question_id: string;
  stem_text: string;
  choices: [string, string, string, string];
}

export interface CreateSessionResponse {
  attempt_id: string;
  questions: SessionQuestion[];
}

// Submit Answer
export interface SubmitAnswerRequest {
  attempt_id: string;
  question_id: string;
  chosen_index?: 0 | 1 | 2 | 3;
  is_dont_know?: boolean;
}

export interface SubmitAnswerSuccessResponse {
  was_correct: boolean;
  correct_choice_index: 0 | 1 | 2 | 3;
  explanation_text?: string;
}

export interface SubmitAnswerErrorResponse {
  code: 'QUESTION_NOT_FOUND' | 'USER_DISABLED';
}

export type SubmitAnswerResponse = SubmitAnswerSuccessResponse | SubmitAnswerErrorResponse;

export function isSubmitError(res: SubmitAnswerResponse): res is SubmitAnswerErrorResponse {
  return 'code' in res;
}

// Bookmarks
export interface ToggleBookmarkRequest {
  question_id: string;
}

export interface ToggleBookmarkResponse {
  is_bookmarked: boolean;
}

export interface BookmarkItem {
  question_id: string;
  stem_text: string;
  subtopic_name: string;
  created_at: string;
}

export interface BookmarkListResponse {
  items: BookmarkItem[];
  has_more: boolean;
  next_page: number | null;
}

// Reports
export type ReportType = 'wrong_key' | 'typo' | 'ambiguous' | 'other';

export interface CreateReportRequest {
  question_id: string;
  report_type: ReportType;
  message?: string;
}

export interface CreateReportResponse {
  report_id: string;
}

// Stats
export interface SubjectStats {
  subject_id: string;
  total_questions: number;
  total_answered: number;
  accuracy_percent: number | null;
  due_today: number;
  bucket_mastered: number;
  bucket_weak: number;
  bucket_almost: number;
  bucket_other: number;
  activity_7d: ActivityDay[];
}

export interface SubtopicStats {
  subtopic_id: string;
  total_questions: number;
  total_answered: number;
  accuracy_percent: number | null;
  due_today: number;
  bucket_mastered: number;
  bucket_weak: number;
  bucket_almost: number;
  bucket_other: number;
  box_distribution: BoxDistribution[];
}

export interface BoxDistribution {
  box_number: number;
  count: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  intensity: number;
}

export interface HeatmapResponse {
  days: HeatmapDay[];
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface Activity7DResponse {
  days: ActivityDay[];
  streak_current: number;
  streak_best: number;
}

// Local Session Storage
export interface LocalSession {
  session_local_id: string;
  attempt_id: string;
  subtopic_id: string;
  subtopic_name: string;
  mode: SessionMode;
  size: number;
  question_ids: string[];
  questions: SessionQuestion[];
  current_index: number;
  answers: Record<string, SubmitAnswerSuccessResponse>;
  stale_skip_count: number;
  created_at: string;
}

// API Error
export interface ApiError {
  code: string;
  message: string;
}
