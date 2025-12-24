// Typed API client for Psydia

import type {
  AuthResponse,
  Subject,
  Topic,
  Subtopic,
  SubtopicOverview,
  CreateSessionRequest,
  CreateSessionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  ToggleBookmarkRequest,
  ToggleBookmarkResponse,
  BookmarkListResponse,
  CreateReportRequest,
  CreateReportResponse,
  SubjectStats,
  SubtopicStats,
  HeatmapResponse,
  Activity7DResponse,
  User,
  ApiError,
} from './types';

import {
  mockUser,
  mockSubjects,
  mockTopics,
  mockSubtopics,
  mockSubtopicOverview,
  mockCreateSession,
  mockSubmitAnswer,
  mockBookmarks,
  mockSubjectStats,
  mockSubtopicStats,
  mockHeatmap,
  mockActivity7D,
} from './mock';

// Configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = !BASE_URL;

// Token storage
const TOKEN_KEY = 'psydia_auth_token';
let subjectsCache: Subject[] | null = null;

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Error class
export class PsydiaApiError extends Error {
  code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'PsydiaApiError';
  }
}

// Fetch wrapper with error handling
async function fetchJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { code: 'UNKNOWN_ERROR', message: response.statusText };
    }
    throw new PsydiaApiError(errorData.code, errorData.message);
  }
  
  return response.json();
}

// API Client
export const api = {
  // Auth
  auth: {
    telegram: async (initData: string): Promise<AuthResponse> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        return { token: 'mock_token_123', user: mockUser };
      }
      const response = await fetchJson<AuthResponse>('/api/app/v1/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({ init_data: initData }),
      });
      setToken(response.token);
      return response;
    },
  },

  // Navigation
  subjects: {
    list: async (): Promise<Subject[]> => {
      if (subjectsCache) {
        return subjectsCache;
      }
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        subjectsCache = mockSubjects;
        return subjectsCache;
      }
      subjectsCache = await fetchJson<Subject[]>('/api/app/v1/subjects');
      return subjectsCache;
    },
  },

  topics: {
    list: async (subjectId: string): Promise<Topic[]> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return mockTopics[subjectId] || [];
      }
      return fetchJson<Topic[]>(`/api/app/v1/topics?subject_id=${subjectId}`);
    },
  },

  subtopics: {
    list: async (topicId: string): Promise<Subtopic[]> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return mockSubtopics[topicId] || [];
      }
      return fetchJson<Subtopic[]>(`/api/app/v1/subtopics?topic_id=${topicId}`);
    },
    
    overview: async (subtopicId: string): Promise<SubtopicOverview> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        return mockSubtopicOverview(subtopicId);
      }
      return fetchJson<SubtopicOverview>(`/api/app/v1/subtopics/${subtopicId}/overview`);
    },
  },

  // Sessions
  sessions: {
    create: async (request: CreateSessionRequest): Promise<CreateSessionResponse> => {
      if (USE_MOCK) {
        return mockCreateSession(request.size);
      }
      return fetchJson<CreateSessionResponse>('/api/app/v1/sessions/create', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },
  },

  // Answers
  answers: {
    submit: async (request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> => {
      if (USE_MOCK) {
        return mockSubmitAnswer(
          request.question_id,
          request.chosen_index,
          request.is_dont_know
        );
      }
      return fetchJson<SubmitAnswerResponse>('/api/app/v1/answers/submit', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },
  },

  // Bookmarks
  bookmarks: {
    toggle: async (request: ToggleBookmarkRequest): Promise<ToggleBookmarkResponse> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return { is_bookmarked: true };
      }
      return fetchJson<ToggleBookmarkResponse>('/api/app/v1/bookmarks/toggle', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },
    
    list: async (page: number = 1): Promise<BookmarkListResponse> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return mockBookmarks;
      }
      return fetchJson<BookmarkListResponse>(`/api/app/v1/bookmarks/list?page=${page}`);
    },
  },

  // Reports
  reports: {
    create: async (request: CreateReportRequest): Promise<CreateReportResponse> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        return { report_id: 'rep_mock_123' };
      }
      const { question_id, report_type, message } = request;
      return fetchJson<CreateReportResponse>('/api/app/v1/reports/create', {
        method: 'POST',
        body: JSON.stringify({ question_id, report_type, message }),
      });
    },
  },

  // Stats
  stats: {
    subject: async (subjectId: string): Promise<SubjectStats> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        return mockSubjectStats(subjectId);
      }
      return fetchJson<SubjectStats>(`/api/app/v1/stats/subject/${subjectId}`);
    },
    
    subtopic: async (subtopicId: string): Promise<SubtopicStats> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        return mockSubtopicStats(subtopicId);
      }
      return fetchJson<SubtopicStats>(`/api/app/v1/stats/subtopic/${subtopicId}`);
    },
    
    heatmap: async (): Promise<HeatmapResponse> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300));
        return mockHeatmap;
      }
      return fetchJson<HeatmapResponse>('/api/app/v1/stats/heatmap');
    },
    
    activity7d: async (): Promise<Activity7DResponse> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return mockActivity7D;
      }
      return fetchJson<Activity7DResponse>('/api/app/v1/stats/activity-7d');
    },
  },

  // User
  user: {
    me: async (): Promise<User> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return mockUser;
      }
      return fetchJson<User>('/api/app/v1/user/me');
    },
    
    update: async (data: Partial<Pick<User, 'display_name' | 'avatar_id' | 'theme'>>): Promise<User> => {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 200));
        return { ...mockUser, ...data };
      }
      return fetchJson<User>('/api/app/v1/user/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },
};

export default api;
