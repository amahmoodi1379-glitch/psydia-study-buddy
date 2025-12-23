// Mock data for development without backend

import type {
  Subject,
  Topic,
  Subtopic,
  SubtopicOverview,
  CreateSessionResponse,
  SessionQuestion,
  SubmitAnswerSuccessResponse,
  BookmarkListResponse,
  SubjectStats,
  SubtopicStats,
  HeatmapResponse,
  Activity7DResponse,
  User,
} from './types';

// Helpers
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomId = () => Math.random().toString(36).substring(2, 10);

// Mock user
export const mockUser: User = {
  id: 'user_1',
  telegram_id: 123456789,
  display_name: 'کاربر آزمایشی',
  avatar_id: 5,
  theme: 'dark',
  streak_current: 7,
  streak_best: 14,
  total_answered: 342,
  created_at: '2024-01-15T10:00:00Z',
};

// Mock subjects
export const mockSubjects: Subject[] = [
  { id: 'sub_1', name: 'روان‌شناسی عمومی', icon_emoji: '🧠', topic_count: 8, order: 1 },
  { id: 'sub_2', name: 'روان‌شناسی رشد', icon_emoji: '🌱', topic_count: 6, order: 2 },
  { id: 'sub_3', name: 'روان‌شناسی بالینی', icon_emoji: '💊', topic_count: 10, order: 3 },
  { id: 'sub_4', name: 'آسیب‌شناسی روانی', icon_emoji: '🔬', topic_count: 12, order: 4 },
  { id: 'sub_5', name: 'روش تحقیق', icon_emoji: '📊', topic_count: 5, order: 5 },
  { id: 'sub_6', name: 'آمار و روان‌سنجی', icon_emoji: '📈', topic_count: 7, order: 6 },
];

// Mock topics
export const mockTopics: Record<string, Topic[]> = {
  sub_1: [
    { id: 'top_1_1', subject_id: 'sub_1', name: 'هوش و استعداد', subtopic_count: 4, order: 1 },
    { id: 'top_1_2', subject_id: 'sub_1', name: 'یادگیری', subtopic_count: 5, order: 2 },
    { id: 'top_1_3', subject_id: 'sub_1', name: 'حافظه', subtopic_count: 3, order: 3 },
    { id: 'top_1_4', subject_id: 'sub_1', name: 'انگیزش', subtopic_count: 4, order: 4 },
  ],
  sub_2: [
    { id: 'top_2_1', subject_id: 'sub_2', name: 'رشد جنینی و نوزادی', subtopic_count: 3, order: 1 },
    { id: 'top_2_2', subject_id: 'sub_2', name: 'رشد کودکی', subtopic_count: 4, order: 2 },
    { id: 'top_2_3', subject_id: 'sub_2', name: 'رشد نوجوانی', subtopic_count: 3, order: 3 },
  ],
  sub_3: [
    { id: 'top_3_1', subject_id: 'sub_3', name: 'رویکردهای درمانی', subtopic_count: 6, order: 1 },
    { id: 'top_3_2', subject_id: 'sub_3', name: 'ارزیابی بالینی', subtopic_count: 4, order: 2 },
  ],
};

// Mock subtopics
export const mockSubtopics: Record<string, Subtopic[]> = {
  top_1_1: [
    { id: 'sbt_1_1_1', topic_id: 'top_1_1', name: 'نظریه‌های هوش', question_count: 45, order: 1 },
    { id: 'sbt_1_1_2', topic_id: 'top_1_1', name: 'آزمون‌های هوش', question_count: 38, order: 2 },
    { id: 'sbt_1_1_3', topic_id: 'top_1_1', name: 'هوش هیجانی', question_count: 25, order: 3 },
  ],
  top_1_2: [
    { id: 'sbt_1_2_1', topic_id: 'top_1_2', name: 'شرطی‌سازی کلاسیک', question_count: 52, order: 1 },
    { id: 'sbt_1_2_2', topic_id: 'top_1_2', name: 'شرطی‌سازی عامل', question_count: 48, order: 2 },
    { id: 'sbt_1_2_3', topic_id: 'top_1_2', name: 'یادگیری اجتماعی', question_count: 35, order: 3 },
  ],
  top_1_3: [
    { id: 'sbt_1_3_1', topic_id: 'top_1_3', name: 'انواع حافظه', question_count: 42, order: 1 },
    { id: 'sbt_1_3_2', topic_id: 'top_1_3', name: 'فراموشی', question_count: 28, order: 2 },
  ],
};

// Mock subtopic overview
export const mockSubtopicOverview = (subtopicId: string): SubtopicOverview => {
  const subtopic = Object.values(mockSubtopics).flat().find(s => s.id === subtopicId);
  return {
    subtopic_id: subtopicId,
    subtopic_name: subtopic?.name || 'زیرموضوع',
    topic_name: 'موضوع آزمایشی',
    subject_name: 'درس آزمایشی',
    status_label: 'in_progress',
    due_count: 12,
    weak_count: 5,
    new_count: 28,
    has_sufficient_data: true,
    total_answered: 42,
    accuracy_percent: 72,
    last_session_at: new Date().toISOString(),
  };
};

// Mock questions
const sampleQuestions: SessionQuestion[] = [
  {
    question_id: 'q_1',
    stem_text: 'کدام یک از نظریه‌پردازان زیر، هوش را به صورت عامل عمومی (g) تعریف کرده است؟',
    choices: ['گاردنر', 'اسپیرمن', 'استرنبرگ', 'گیلفورد'],
  },
  {
    question_id: 'q_2',
    stem_text: 'در نظریه هوش چندگانه گاردنر، توانایی درک و تحلیل احساسات دیگران مربوط به کدام نوع هوش است؟',
    choices: ['هوش درون‌فردی', 'هوش بین‌فردی', 'هوش زبانی', 'هوش موسیقیایی'],
  },
  {
    question_id: 'q_3',
    stem_text: 'آزمون هوش وکسلر بزرگسالان (WAIS) شامل چند خرده‌آزمون است؟',
    choices: ['۱۰ خرده‌آزمون', '۱۵ خرده‌آزمون', '۱۱ خرده‌آزمون', '۱۲ خرده‌آزمون'],
  },
  {
    question_id: 'q_4',
    stem_text: 'مفهوم "سن عقلی" اولین بار توسط چه کسی مطرح شد؟',
    choices: ['ترمن', 'بینه', 'وکسلر', 'کتل'],
  },
  {
    question_id: 'q_5',
    stem_text: 'کدام گزینه در مورد هوش سیال صحیح است؟',
    choices: [
      'با آموزش و تجربه افزایش می‌یابد',
      'به توانایی حل مسائل جدید مربوط است',
      'به دانش انباشته شده بستگی دارد',
      'در طول زندگی ثابت می‌ماند',
    ],
  },
];

// Generate more questions dynamically
const generateQuestions = (count: number): SessionQuestion[] => {
  const questions: SessionQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const base = sampleQuestions[i % sampleQuestions.length];
    questions.push({
      ...base,
      question_id: `q_${randomId()}`,
    });
  }
  return questions;
};

// Mock create session
export const mockCreateSession = async (size: number): Promise<CreateSessionResponse> => {
  await delay(500);
  const questions = generateQuestions(size);
  return {
    attempt_id: `att_${randomId()}`,
    questions,
  };
};

// Mock submit answer
const correctAnswers: Record<string, number> = {
  q_1: 1, // اسپیرمن
  q_2: 1, // هوش بین‌فردی
  q_3: 2, // ۱۱ خرده‌آزمون
  q_4: 1, // بینه
  q_5: 1, // به توانایی حل مسائل جدید
};

export const mockSubmitAnswer = async (
  questionId: string,
  chosenIndex?: number,
  isDontKnow?: boolean
): Promise<SubmitAnswerSuccessResponse> => {
  await delay(400);
  const correctIndex = (correctAnswers[questionId.split('_')[0] + '_' + (parseInt(questionId.split('_')[1]) % 5 + 1)] ?? 1) as 0 | 1 | 2 | 3;
  const wasCorrect = !isDontKnow && chosenIndex === correctIndex;
  
  return {
    was_correct: wasCorrect,
    correct_choice_index: correctIndex,
    explanation_text: 'این پاسخ صحیح است زیرا طبق نظریه‌های کلاسیک روان‌شناسی، این گزینه با تعریف اصلی مطابقت دارد.',
  };
};

// Mock bookmarks
export const mockBookmarks: BookmarkListResponse = {
  items: [
    {
      question_id: 'q_bm_1',
      stem_text: 'در کدام مرحله از رشد شناختی پیاژه، کودک توانایی تفکر انتزاعی را کسب می‌کند؟',
      subtopic_name: 'مراحل رشد شناختی',
      created_at: '2024-03-10T14:30:00Z',
    },
    {
      question_id: 'q_bm_2',
      stem_text: 'اثر هاثورن در کدام زمینه روان‌شناسی مطرح شد؟',
      subtopic_name: 'روش تحقیق',
      created_at: '2024-03-09T11:20:00Z',
    },
  ],
  has_more: false,
  next_page: null,
};

// Mock subject stats
export const mockSubjectStats = (subjectId: string): SubjectStats => ({
  subject_id: subjectId,
  subject_name: mockSubjects.find(s => s.id === subjectId)?.name || 'درس',
  total_questions: 450,
  answered_count: 186,
  accuracy_percent: 68,
  topics: [
    { topic_id: 'top_1', topic_name: 'موضوع ۱', answered_count: 52, accuracy_percent: 75 },
    { topic_id: 'top_2', topic_name: 'موضوع ۲', answered_count: 45, accuracy_percent: 62 },
    { topic_id: 'top_3', topic_name: 'موضوع ۳', answered_count: 89, accuracy_percent: 71 },
  ],
});

// Mock subtopic stats
export const mockSubtopicStats = (subtopicId: string): SubtopicStats => ({
  subtopic_id: subtopicId,
  subtopic_name: 'زیرموضوع آزمایشی',
  topic_name: 'موضوع آزمایشی',
  subject_name: 'درس آزمایشی',
  total_questions: 45,
  answered_count: 28,
  due_count: 8,
  weak_count: 4,
  accuracy_percent: 72,
  sessions_count: 5,
  avg_session_accuracy: 70,
});

// Mock heatmap
export const mockHeatmap: HeatmapResponse = {
  cells: [
    { subtopic_id: 'sbt_1', subtopic_name: 'نظریه‌های هوش', topic_name: 'هوش', bucket_label: 'mastered', answered_count: 45 },
    { subtopic_id: 'sbt_2', subtopic_name: 'آزمون‌های هوش', topic_name: 'هوش', bucket_label: 'almost', answered_count: 38 },
    { subtopic_id: 'sbt_3', subtopic_name: 'شرطی‌سازی', topic_name: 'یادگیری', bucket_label: 'in_progress', answered_count: 25 },
    { subtopic_id: 'sbt_4', subtopic_name: 'حافظه کوتاه‌مدت', topic_name: 'حافظه', bucket_label: 'beginner', answered_count: 10 },
    { subtopic_id: 'sbt_5', subtopic_name: 'انگیزش درونی', topic_name: 'انگیزش', bucket_label: 'beginner', answered_count: 5 },
    { subtopic_id: 'sbt_6', subtopic_name: 'رشد جنینی', topic_name: 'رشد', bucket_label: 'mastered', answered_count: 42 },
  ],
};

// Mock activity
export const mockActivity7D: Activity7DResponse = {
  days: [
    { date: '2024-03-11', count: 25 },
    { date: '2024-03-10', count: 18 },
    { date: '2024-03-09', count: 32 },
    { date: '2024-03-08', count: 0 },
    { date: '2024-03-07', count: 15 },
    { date: '2024-03-06', count: 22 },
    { date: '2024-03-05', count: 28 },
  ],
  streak_current: 7,
  streak_best: 14,
};
