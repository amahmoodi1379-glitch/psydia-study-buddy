// LocalStorage helpers for Psydia

import type { LocalSession } from '@/api/types';

const SESSION_KEY = 'psydia_session_v1';
const LAST_SUBTOPIC_KEY = 'psydia_last_subtopic';
const THEME_KEY = 'psydia_theme';

// Session storage
export const sessionStorage = {
  get: (): LocalSession | null => {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      if (!data) return null;
      return JSON.parse(data) as LocalSession;
    } catch {
      return null;
    }
  },

  set: (session: LocalSession): void => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  update: (updates: Partial<LocalSession>): LocalSession | null => {
    const current = sessionStorage.get();
    if (!current) return null;
    
    const updated = { ...current, ...updates };
    sessionStorage.set(updated);
    return updated;
  },

  clear: (): void => {
    localStorage.removeItem(SESSION_KEY);
  },

  hasActiveSession: (): boolean => {
    const session = sessionStorage.get();
    if (!session) return false;
    return session.current_index < session.question_ids.length;
  },

  incrementStaleCount: (): number => {
    const session = sessionStorage.get();
    if (!session) return 0;
    
    const newCount = session.stale_skip_count + 1;
    sessionStorage.update({ stale_skip_count: newCount });
    return newCount;
  },

  removeQuestion: (questionId: string): void => {
    const session = sessionStorage.get();
    if (!session) return;
    
    const newIds = session.question_ids.filter(id => id !== questionId);
    const newQuestions = session.questions.filter(q => q.question_id !== questionId);
    
    sessionStorage.update({
      question_ids: newIds,
      questions: newQuestions,
    });
  },
};

// Last visited subtopic
export const lastSubtopicStorage = {
  get: (): { id: string; name: string } | null => {
    try {
      const data = localStorage.getItem(LAST_SUBTOPIC_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  set: (id: string, name: string): void => {
    try {
      localStorage.setItem(LAST_SUBTOPIC_KEY, JSON.stringify({ id, name }));
    } catch (error) {
      console.error('Failed to save last subtopic:', error);
    }
  },

  clear: (): void => {
    localStorage.removeItem(LAST_SUBTOPIC_KEY);
  },
};

// Theme storage
export const themeStorage = {
  get: (): 'light' | 'dark' => {
    try {
      const theme = localStorage.getItem(THEME_KEY);
      return theme === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  },

  set: (theme: 'light' | 'dark'): void => {
    try {
      localStorage.setItem(THEME_KEY, theme);
      // Apply to document
      if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  },

  init: (): void => {
    const theme = themeStorage.get();
    themeStorage.set(theme);
  },
};

// Generate unique local session ID
export const generateSessionLocalId = (): string => {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};
