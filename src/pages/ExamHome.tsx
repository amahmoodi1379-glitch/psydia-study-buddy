import { useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TabBar } from '@/components/TabBar';
import { ResumeCard } from '@/components/ResumeCard';
import { DailyPlanCard } from '@/components/DailyPlanCard';
import { NavigationCard } from '@/components/NavigationCard';
import { StreakBadge } from '@/components/StreakBadge';
import { PageLoading } from '@/components/LoadingSpinner';
import { sessionStorage, lastSubtopicStorage } from '@/lib/storage';
import { api } from '@/api/client';
import type { LocalSession, Subject, User } from '@/api/types';

export default function ExamHome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSession, setActiveSession] = useState<LocalSession | null>(null);
  const [lastSubtopic, setLastSubtopic] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Check for active session
      const session = sessionStorage.get();
      if (session && session.current_index < session.question_ids.length) {
        setActiveSession(session);
      }

      // Get last subtopic
      const last = lastSubtopicStorage.get();
      setLastSubtopic(last);

      // Load user and subjects in parallel
      const [userData, subjectsData] = await Promise.all([
        api.user.me(),
        api.subjects.list(),
      ]);

      setUser(userData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissSession = () => {
    setActiveSession(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <PageLoading />
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header with streak */}
      <header className="sticky top-0 z-40 glass border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <h1 className="text-lg font-bold">psydia</h1>
          {user && (
            <StreakBadge current={user.streak_current} size="sm" />
          )}
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Resume card if active session */}
        {activeSession && (
          <ResumeCard session={activeSession} onDismiss={handleDismissSession} />
        )}

        {/* Daily plan card */}
        <DailyPlanCard lastSubtopic={lastSubtopic} />

        {/* Browse subjects */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">دروس</h2>
          </div>
          
          <div className="space-y-2">
            {subjects.map((subject, index) => (
              <NavigationCard
                key={subject.id}
                to={`/subjects/${subject.id}/topics`}
                emoji={subject.icon_emoji}
                title={subject.name}
                count={subject.topic_count}
                countLabel="موضوع"
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </main>

      <TabBar />
    </div>
  );
}
