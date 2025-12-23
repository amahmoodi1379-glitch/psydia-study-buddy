import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { StatusBadge } from '@/components/StatusBadge';
import { CountBadge } from '@/components/CountBadge';
import { SessionModeSelector } from '@/components/SessionModeSelector';
import { PageLoading } from '@/components/LoadingSpinner';
import { sessionStorage, lastSubtopicStorage, generateSessionLocalId } from '@/lib/storage';
import { haptic } from '@/lib/telegram';
import { api } from '@/api/client';
import type { SubtopicOverview, SessionMode, LocalSession } from '@/api/types';

export default function SubtopicHub() {
  const { subtopicId } = useParams<{ subtopicId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [overview, setOverview] = useState<SubtopicOverview | null>(null);
  const [selectedMode, setSelectedMode] = useState<SessionMode>('daily_mix');
  const [selectedSize, setSelectedSize] = useState<10 | 20 | 30>(10);

  useEffect(() => {
    if (subtopicId) {
      loadData();
    }
  }, [subtopicId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const overviewData = await api.subtopics.overview(subtopicId!);
      setOverview(overviewData);
      
      // Save as last visited subtopic
      lastSubtopicStorage.set(subtopicId!, overviewData.subtopic_name);
    } catch (error) {
      console.error('Failed to load subtopic overview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!overview) return;
    
    try {
      setIsStarting(true);
      haptic.medium();

      // Create session via API
      const response = await api.sessions.create({
        subtopic_id: subtopicId!,
        mode: selectedMode,
        size: selectedSize,
      });

      // Save to local storage
      const localSession: LocalSession = {
        session_local_id: generateSessionLocalId(),
        attempt_id: response.attempt_id,
        subtopic_id: subtopicId!,
        subtopic_name: overview.subtopic_name,
        mode: selectedMode,
        size: selectedSize,
        question_ids: response.questions.map(q => q.question_id),
        questions: response.questions,
        current_index: 0,
        answers: {},
        stale_skip_count: 0,
        created_at: new Date().toISOString(),
      };

      sessionStorage.set(localSession);

      // Navigate to player
      navigate('/player');
    } catch (error) {
      console.error('Failed to create session:', error);
      haptic.error();
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="زیرموضوع" showBack />
        <PageLoading />
        <TabBar />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="خطا" showBack />
        <div className="px-4 py-8 text-center text-muted-foreground">
          اطلاعات زیرموضوع یافت نشد
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={overview.subtopic_name}
        subtitle={`${overview.topic_name} • ${overview.subject_name}`}
        showBack
      />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Status card */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">وضعیت پیشرفت</h3>
            <StatusBadge status={overview.status_label} />
          </div>

          {/* Counts */}
          <div className="grid grid-cols-3 gap-4">
            <CountBadge
              count={overview.due_count}
              label="موعد مرور"
              variant="due"
              insufficientData={!overview.has_sufficient_data}
            />
            <CountBadge
              count={overview.weak_count}
              label="نقاط ضعف"
              variant="weak"
              insufficientData={!overview.has_sufficient_data}
            />
            <CountBadge
              count={overview.new_count}
              label="جدید"
              variant="new"
            />
          </div>

          {!overview.has_sufficient_data && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              داده کافی نیست — چند جلسه تمرین کنید
            </p>
          )}
        </div>

        {/* Stats summary */}
        {overview.accuracy_percent !== null && (
          <div className="bg-card rounded-xl border border-border p-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">دقت پاسخ‌ها</span>
              <span className="text-lg font-bold text-primary">%{overview.accuracy_percent}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full gradient-primary transition-all"
                style={{ width: `${overview.accuracy_percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Session mode selector */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <SessionModeSelector
            dueCount={overview.due_count}
            weakCount={overview.weak_count}
            newCount={overview.new_count}
            hasSufficientData={overview.has_sufficient_data}
            selectedMode={selectedMode}
            selectedSize={selectedSize}
            onModeChange={setSelectedMode}
            onSizeChange={setSelectedSize}
            onStart={handleStartSession}
            isLoading={isStarting}
          />
        </div>
      </main>

      <TabBar />
    </div>
  );
}
