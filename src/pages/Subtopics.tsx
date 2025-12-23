import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { NavigationCard } from '@/components/NavigationCard';
import { PageLoading } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { FolderOpen } from 'lucide-react';
import { api } from '@/api/client';
import type { Subtopic } from '@/api/types';

export default function Subtopics() {
  const { topicId } = useParams<{ topicId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);

  useEffect(() => {
    if (topicId) {
      loadData();
    }
  }, [topicId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const subtopicsData = await api.subtopics.list(topicId!);
      setSubtopics(subtopicsData);
    } catch (error) {
      console.error('Failed to load subtopics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title="زیرموضوعات"
        subtitle={`${subtopics.length} زیرموضوع`}
        showBack
      />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <PageLoading />
        ) : subtopics.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="زیرموضوعی یافت نشد"
            description="هنوز زیرموضوعی برای این موضوع اضافه نشده است"
          />
        ) : (
          <div className="space-y-2">
            {subtopics.map((subtopic, index) => (
              <NavigationCard
                key={subtopic.id}
                to={`/hub/${subtopic.id}`}
                title={subtopic.name}
                count={subtopic.question_count}
                countLabel="سوال"
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </main>

      <TabBar />
    </div>
  );
}
