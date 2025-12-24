import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { PageLoading } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Layers } from 'lucide-react';
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
const intensityLabels = ['بدون داده', 'کم', 'متوسط', 'خوب', 'عالی'];

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

  const columns = 3;

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="نقشه تسلط" showBack backTo="/profile" />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <PageLoading />
        ) : !heatmap || heatmap.subtopics.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="داده‌ای یافت نشد"
            description="پس از تمرین، نقشه تسلط شما اینجا نمایش داده می‌شود"
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

            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {heatmap.subtopics.map((subtopic) => (
                <div
                  key={subtopic.subtopic_id}
                  className={cn(
                    'rounded-lg p-3 text-xs text-primary-foreground/90 min-h-[64px] flex flex-col justify-between',
                    intensityColors[Math.min(subtopic.intensity, intensityColors.length - 1)]
                  )}
                  title={`${subtopic.subtopic_name} • تسلط ${subtopic.mastery_percent}% • اعتماد ${subtopic.confidence_percent}%`}
                >
                  <span className="font-semibold text-[11px] leading-4">{subtopic.subtopic_name}</span>
                  <span className="text-[10px] opacity-80">تسلط {subtopic.mastery_percent}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <TabBar />
    </div>
  );
}
