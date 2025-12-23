import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { NavigationCard } from '@/components/NavigationCard';
import { PageLoading } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { FolderOpen } from 'lucide-react';
import { api } from '@/api/client';
import type { Topic, Subject } from '@/api/types';

export default function Topics() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (subjectId) {
      loadData();
    }
  }, [subjectId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load topics and subject info
      const [topicsData, subjectsData] = await Promise.all([
        api.topics.list(subjectId!),
        api.subjects.list(),
      ]);

      setTopics(topicsData);
      setSubject(subjectsData.find(s => s.id === subjectId) || null);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader
        title={subject?.name || 'موضوعات'}
        subtitle={`${topics.length} موضوع`}
        showBack
        backTo="/"
      />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <PageLoading />
        ) : topics.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="موضوعی یافت نشد"
            description="هنوز موضوعی برای این درس اضافه نشده است"
          />
        ) : (
          <div className="space-y-2">
            {topics.map((topic, index) => (
              <NavigationCard
                key={topic.id}
                to={`/topics/${topic.id}/subtopics`}
                title={topic.name}
                count={topic.subtopic_count}
                countLabel="زیرموضوع"
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
