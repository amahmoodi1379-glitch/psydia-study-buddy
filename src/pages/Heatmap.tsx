import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { PageLoading } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { Grid3X3 } from 'lucide-react';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { HeatmapResponse, StatusLabel } from '@/api/types';

const bucketColors: Record<StatusLabel, string> = {
  mastered: 'bg-bucket-mastered',
  almost: 'bg-bucket-almost',
  in_progress: 'bg-bucket-progress',
  beginner: 'bg-bucket-beginner',
};

const bucketLabels: Record<StatusLabel, string> = {
  mastered: 'تسلط کامل',
  almost: 'تقریباً تسلط',
  in_progress: 'در حال پیشرفت',
  beginner: 'مبتدی',
};

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

  // Group by topic
  const groupedByTopic = heatmap?.cells.reduce((acc, cell) => {
    if (!acc[cell.topic_name]) {
      acc[cell.topic_name] = [];
    }
    acc[cell.topic_name].push(cell);
    return acc;
  }, {} as Record<string, typeof heatmap.cells>);

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="نقشه پیشرفت" showBack backTo="/profile" />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <PageLoading />
        ) : !heatmap || heatmap.cells.length === 0 ? (
          <EmptyState
            icon={Grid3X3}
            title="داده‌ای یافت نشد"
            description="پس از تمرین، نقشه پیشرفت شما اینجا نمایش داده می‌شود"
          />
        ) : (
          <>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-6 justify-center animate-slide-up">
              {(['mastered', 'almost', 'in_progress', 'beginner'] as StatusLabel[]).map(bucket => (
                <div key={bucket} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-3 rounded', bucketColors[bucket])} />
                  <span className="text-xs text-muted-foreground">{bucketLabels[bucket]}</span>
                </div>
              ))}
            </div>

            {/* Grid by topic */}
            <div className="space-y-6">
              {groupedByTopic && Object.entries(groupedByTopic).map(([topicName, cells], topicIndex) => (
                <div 
                  key={topicName} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${topicIndex * 50}ms` }}
                >
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">{topicName}</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {cells.map(cell => (
                      <div
                        key={cell.subtopic_id}
                        className={cn(
                          'aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-center transition-transform hover:scale-105',
                          bucketColors[cell.bucket_label]
                        )}
                        title={cell.subtopic_name}
                      >
                        <span className="text-[10px] text-primary-foreground font-medium line-clamp-2 leading-tight">
                          {cell.subtopic_name}
                        </span>
                        <span className="text-[10px] text-primary-foreground/70 mt-0.5">
                          {cell.answered_count}
                        </span>
                      </div>
                    ))}
                  </div>
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
