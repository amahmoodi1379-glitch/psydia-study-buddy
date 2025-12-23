import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { PageLoading } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { BarChart3, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { haptic } from '@/lib/telegram';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { Subject } from '@/api/types';

export default function Stats() {
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await api.subjects.list();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="آمار و عملکرد" showBack backTo="/profile" />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <PageLoading />
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="آماری یافت نشد"
            description="پس از پاسخ دادن به سوالات، آمار شما اینجا نمایش داده می‌شود"
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              درسی را برای مشاهده آمار جزئی انتخاب کنید:
            </p>
            {subjects.map((subject, index) => (
              <Link
                key={subject.id}
                to={`/profile/stats/subject/${subject.id}`}
                onClick={() => haptic.light()}
                className={cn(
                  'flex items-center gap-3 p-4 bg-card rounded-xl border border-border tap-highlight animate-slide-up'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-secondary/50 rounded-lg">
                  {subject.icon_emoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{subject.name}</h3>
                  <p className="text-xs text-muted-foreground">{subject.topic_count} موضوع</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </main>

      <TabBar />
    </div>
  );
}
