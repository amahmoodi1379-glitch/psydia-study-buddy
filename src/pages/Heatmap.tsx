import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { PageLoading } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Flame } from 'lucide-react';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { HeatmapResponse } from '@/api/types';

const intensityColors = [
  'bg-secondary',
  'bg-primary/20',
  'bg-primary/40',
  'bg-primary/60',
  'bg-primary',
];
const intensityLabels = ['بدون فعالیت', 'کم', 'متوسط', 'زیاد', 'خیلی زیاد'];

export default function Heatmap() {
  const [isLoading, setIsLoading] = useState(true);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await api.stats.heatmap();
      setHeatmap(data);
    } catch (error) {
      console.error('Failed to load heatmap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const weeks = heatmap ? Math.ceil(heatmap.days.length / 7) : 0;

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="نقشه فعالیت" showBack backTo="/profile" />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <PageLoading />
        ) : !heatmap || heatmap.days.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="داده‌ای یافت نشد"
            description="پس از تمرین، نقشه پیشرفت شما اینجا نمایش داده می‌شود"
          />
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-6 justify-center animate-slide-up">
              {intensityLabels.map((label, index) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-3 rounded', intensityColors[index])} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{heatmap.days[0]?.date}</span>
                <span>{heatmap.days[heatmap.days.length - 1]?.date}</span>
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
              >
                {heatmap.days.map((day, index) => (
                  <div
                    key={`${day.date}-${index}`}
                    className={cn(
                      'aspect-square rounded-md flex items-center justify-center text-[10px] font-medium text-primary-foreground/80',
                      intensityColors[Math.min(day.intensity, intensityColors.length - 1)]
                    )}
                    title={`${day.date} • ${day.count} سوال`}
                  >
                    {new Date(day.date).getUTCDate()}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, weeks * 7 - heatmap.days.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square rounded-md bg-transparent" />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <TabBar />
    </div>
  );
}
