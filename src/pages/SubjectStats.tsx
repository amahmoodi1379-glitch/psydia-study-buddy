import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { PageLoading } from '@/components/LoadingSpinner';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { SubjectStats as SubjectStatsType, Subject } from '@/api/types';

const WEEKDAY_ABBREVIATIONS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export default function SubjectStats() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SubjectStatsType | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (subjectId) {
      loadData();
    }
  }, [subjectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, subjects] = await Promise.all([
        api.stats.subject(subjectId!),
        api.subjects.list(),
      ]);
      setStats(statsData);
      setSubject(subjects.find(item => item.id === subjectId) || null);
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
    ? Math.round((stats.total_answered / stats.total_questions) * 100) 
    : 0;

  const activityMaxCount = Math.max(...stats.activity_7d.map(day => day.count), 1);

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title={subject?.name || 'آمار درس'} showBack backTo="/profile/stats" />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Overview card */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.accuracy_percent !== null ? `%${stats.accuracy_percent}` : '—'}
              </div>
              <div className="text-xs text-muted-foreground">دقت کلی</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total_answered}</div>
              <div className="text-xs text-muted-foreground">پاسخ داده شده</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.due_today}</div>
              <div className="text-xs text-muted-foreground">موعد امروز</div>
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
              {stats.total_answered} از {stats.total_questions}
            </div>
          </div>
        </div>

        {/* Buckets */}
        <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <h3 className="text-sm font-medium mb-3">وضعیت سوالات</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
            { label: 'تسلط کامل', value: stats.bucket_mastered, color: 'text-success' },
            { label: 'تقریباً تسلط', value: stats.bucket_almost, color: 'text-warning' },
            { label: 'ضعیف', value: stats.bucket_weak, color: 'text-destructive' },
            { label: 'ناکافی', value: stats.bucket_insufficient, color: 'text-muted-foreground' },
          ].map((bucket, index) => (
              <div
                key={bucket.label}
                className="bg-card rounded-xl border border-border p-4 animate-slide-up"
                style={{ animationDelay: `${(index + 2) * 50}ms` }}
              >
                <div className={cn('text-xl font-bold mb-1', bucket.color)}>%{bucket.value}</div>
                <div className="text-xs text-muted-foreground">{bucket.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-medium mb-3">فعالیت ۷ روز اخیر</h3>
          <div className="flex items-end justify-between gap-1 h-16">
            {stats.activity_7d.map((day, index) => {
              const height = (day.count / activityMaxCount) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div 
                    className={cn(
                      'w-full rounded-t transition-all',
                      day.count > 0 ? 'gradient-primary' : 'bg-secondary'
                    )}
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {WEEKDAY_ABBREVIATIONS[index % WEEKDAY_ABBREVIATIONS.length]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <TabBar />
    </div>
  );
}
