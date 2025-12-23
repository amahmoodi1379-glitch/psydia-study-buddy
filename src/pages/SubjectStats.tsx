import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { PageLoading } from '@/components/LoadingSpinner';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { SubjectStats as SubjectStatsType } from '@/api/types';

export default function SubjectStats() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SubjectStatsType | null>(null);

  useEffect(() => {
    if (subjectId) {
      loadData();
    }
  }, [subjectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await api.stats.subject(subjectId!);
      setStats(data);
    } catch (error) {
      console.error('Failed to load subject stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="آمار درس" showBack backTo="/profile/stats" />
        <PageLoading />
        <TabBar />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="خطا" showBack backTo="/profile/stats" />
        <div className="px-4 py-8 text-center text-muted-foreground">
          اطلاعات یافت نشد
        </div>
        <TabBar />
      </div>
    );
  }

  const progress = stats.total_questions > 0 
    ? Math.round((stats.answered_count / stats.total_questions) * 100) 
    : 0;

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title={stats.subject_name} showBack backTo="/profile/stats" />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Overview card */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.accuracy_percent !== null ? `%${stats.accuracy_percent}` : '—'}
              </div>
              <div className="text-xs text-muted-foreground">دقت کلی</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.answered_count}</div>
              <div className="text-xs text-muted-foreground">پاسخ داده شده</div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>پیشرفت</span>
              <span>%{progress}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full gradient-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-left">
              {stats.answered_count} از {stats.total_questions}
            </div>
          </div>
        </div>

        {/* Topics breakdown */}
        <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <h3 className="text-sm font-medium mb-3">موضوعات</h3>
          <div className="space-y-2">
            {stats.topics.map((topic, index) => (
              <div 
                key={topic.topic_id}
                className="bg-card rounded-xl border border-border p-4 animate-slide-up"
                style={{ animationDelay: `${(index + 2) * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{topic.topic_name}</h4>
                  <span className={cn(
                    'text-sm font-bold',
                    topic.accuracy_percent !== null && topic.accuracy_percent >= 70 
                      ? 'text-success' 
                      : topic.accuracy_percent !== null && topic.accuracy_percent >= 50 
                      ? 'text-warning' 
                      : 'text-muted-foreground'
                  )}>
                    {topic.accuracy_percent !== null ? `%${topic.accuracy_percent}` : '—'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {topic.answered_count} پاسخ
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <TabBar />
    </div>
  );
}
