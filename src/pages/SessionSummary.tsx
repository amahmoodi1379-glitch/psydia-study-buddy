import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, HelpCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { FullPageLoading } from '@/components/LoadingSpinner';
import { sessionStorage, lastSubtopicStorage } from '@/lib/storage';
import { haptic } from '@/lib/telegram';
import type { LocalSession } from '@/api/types';

export default function SessionSummary() {
  const navigate = useNavigate();
  const [session, setSession] = useState<LocalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedSession = sessionStorage.get();
    if (!savedSession) {
      navigate('/');
      return;
    }
    setSession(savedSession);
    setIsLoading(false);
    
    // Clear the session after loading summary
    sessionStorage.clear();
  }, [navigate]);

  if (isLoading || !session) {
    return <FullPageLoading />;
  }

  const totalAnswered = Object.keys(session.answers).length;
  const correctCount = Object.values(session.answers).filter(a => a.was_correct).length;
  const incorrectCount = Object.values(session.answers).filter(a => !a.was_correct).length;
  const dontKnowCount = totalAnswered - correctCount - incorrectCount;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const getPerformanceMessage = () => {
    if (accuracy >= 80) return { text: 'عالی بود!', emoji: '🎉' };
    if (accuracy >= 60) return { text: 'خوب بود!', emoji: '👍' };
    if (accuracy >= 40) return { text: 'ادامه بده!', emoji: '💪' };
    return { text: 'تمرین بیشتر نیاز است', emoji: '📚' };
  };

  const performance = getPerformanceMessage();

  const handleRetry = () => {
    haptic.medium();
    const lastSubtopic = lastSubtopicStorage.get();
    if (lastSubtopic) {
      navigate(`/hub/${lastSubtopic.id}`);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    haptic.light();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-8">
      <PageHeader title="نتیجه آزمون" />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Performance header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="text-6xl mb-4">{performance.emoji}</div>
          <h2 className="text-2xl font-bold mb-2">{performance.text}</h2>
          <p className="text-muted-foreground">{session.subtopic_name}</p>
        </div>

        {/* Accuracy circle */}
        <div className="flex justify-center mb-8 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${accuracy * 3.52} 352`}
                className="text-primary transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold">%{accuracy}</div>
                <div className="text-xs text-muted-foreground">دقت</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div className="text-xl font-bold text-success">{correctCount}</div>
            <div className="text-xs text-muted-foreground">درست</div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="flex justify-center mb-2">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="text-xl font-bold text-destructive">{incorrectCount}</div>
            <div className="text-xs text-muted-foreground">نادرست</div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="flex justify-center mb-2">
              <HelpCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-xl font-bold">{dontKnowCount}</div>
            <div className="text-xs text-muted-foreground">نمی‌دانم</div>
          </div>
        </div>

        {/* Session info */}
        <div className="bg-card rounded-xl border border-border p-4 mb-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">تعداد سوالات</span>
            <span className="font-medium">{session.size}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">پاسخ داده شده</span>
            <span className="font-medium">{totalAnswered}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">حالت</span>
            <span className="font-medium">
              {session.mode === 'daily_mix' ? 'ترکیب روزانه' : 
               session.mode === 'due_only' ? 'موعد مرور' :
               session.mode === 'weak_first' ? 'نقاط ضعف' :
               session.mode === 'new_only' ? 'جدید' :
               session.mode === 'bookmarks' ? 'نشان‌شده' : 'مرور آزاد'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Button
            onClick={handleRetry}
            className="w-full gradient-primary text-primary-foreground tap-highlight"
          >
            <RotateCcw className="w-4 h-4 ml-2" />
            جلسه جدید
          </Button>
          
          <Button
            onClick={handleHome}
            variant="outline"
            className="w-full tap-highlight"
          >
            <Home className="w-4 h-4 ml-2" />
            بازگشت به خانه
          </Button>
        </div>
      </main>
    </div>
  );
}
