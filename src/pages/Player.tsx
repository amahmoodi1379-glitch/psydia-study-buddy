import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionCard } from '@/components/QuestionCard';
import { ReportModal } from '@/components/ReportModal';
import { FullPageLoading } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { sessionStorage } from '@/lib/storage';
import { haptic } from '@/lib/telegram';
import { api } from '@/api/client';
import { isSubmitError } from '@/api/types';
import type { LocalSession, SubmitAnswerSuccessResponse, ReportType } from '@/api/types';

const MAX_STALE_SKIPS = 3;

export default function Player() {
  const navigate = useNavigate();
  const [session, setSession] = useState<LocalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  const [currentResult, setCurrentResult] = useState<SubmitAnswerSuccessResponse | undefined>();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [staleError, setStaleError] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = () => {
    const savedSession = sessionStorage.get();
    if (!savedSession || savedSession.question_ids.length === 0) {
      navigate('/');
      return;
    }
    setSession(savedSession);
    
    // Check if current question already has an answer
    const currentQuestion = savedSession.questions[savedSession.current_index];
    if (currentQuestion && savedSession.answers[currentQuestion.question_id]) {
      setCurrentResult(savedSession.answers[currentQuestion.question_id]);
    }
    
    setIsLoading(false);
  };

const currentQuestion = session?.questions?.[session.current_index];

    const handleAnswer = useCallback(async (choiceIndex: 0 | 1 | 2 | 3) => {
    if (!session || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    setSelectedIndex(choiceIndex);

    try {
      const attemptId = `${session.attempt_id}:${currentQuestion.question_id}`;

      const response = await api.answers.submit({
        attempt_id: attemptId,
        question_id: currentQuestion.question_id,
        chosen_index: choiceIndex,
      });

      if (isSubmitError(response)) {
        if (response.code === 'QUESTION_NOT_FOUND') {
          await handleStaleQuestion();
        } else if (response.code === 'USER_DISABLED') {
          haptic.error();
          navigate('/');
        }
        return;
      }

      // Success
      if (response.was_correct) haptic.success();
      else haptic.error();

      setCurrentResult(response);

      // Save answer to session
      const updatedAnswers = { ...session.answers, [currentQuestion.question_id]: response };
      sessionStorage.update({ answers: updatedAnswers });
      setSession(prev => (prev ? { ...prev, answers: updatedAnswers } : null));
    } catch (error) {
      console.error('Failed to submit answer:', error);
      haptic.error();
    } finally {
      setIsSubmitting(false);
    }
  }, [session, currentQuestion, isSubmitting, navigate]);


    const handleDontKnow = useCallback(async () => {
    if (!session || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const attemptId = `${session.attempt_id}:${currentQuestion.question_id}`;

      const response = await api.answers.submit({
        attempt_id: attemptId,
        question_id: currentQuestion.question_id,
        is_dont_know: true,
      });

      if (isSubmitError(response)) {
        if (response.code === 'QUESTION_NOT_FOUND') {
          await handleStaleQuestion();
        }
        return;
      }

      haptic.warning();
      setCurrentResult(response);

      // Save answer
      const updatedAnswers = { ...session.answers, [currentQuestion.question_id]: response };
      sessionStorage.update({ answers: updatedAnswers });
      setSession(prev => (prev ? { ...prev, answers: updatedAnswers } : null));
    } catch (error) {
      console.error('Failed to submit dont know:', error);
      haptic.error();
    } finally {
      setIsSubmitting(false);
    }
  }, [session, currentQuestion, isSubmitting]);


  const handleStaleQuestion = async () => {
    if (!session || !currentQuestion) return;

    // Remove the stale question
    sessionStorage.removeQuestion(currentQuestion.question_id);
    const newStaleCount = sessionStorage.incrementStaleCount();

    if (newStaleCount > MAX_STALE_SKIPS) {
      // Too many stale questions, invalidate session
      sessionStorage.clear();
      setStaleError(true);
      return;
    }

    // Reload session and continue
    loadSession();
  };

  const handleNext = () => {
    if (!session) return;
    
    haptic.light();

    const nextIndex = session.current_index + 1;
    
    if (nextIndex >= session.question_ids.length) {
      // Session complete
      navigate('/summary');
      return;
    }

    // Move to next question
    sessionStorage.update({ current_index: nextIndex });
    setSession(prev => prev ? { ...prev, current_index: nextIndex } : null);
    setCurrentResult(undefined);
    setSelectedIndex(undefined);
  };

  const handleBookmarkToggle = async () => {
    if (!currentQuestion) return;
    
    try {
      const response = await api.bookmarks.toggle({ question_id: currentQuestion.question_id });
      
      setBookmarkedQuestions(prev => {
        const next = new Set(prev);
        if (response.is_bookmarked) {
          next.add(currentQuestion.question_id);
        } else {
          next.delete(currentQuestion.question_id);
        }
        return next;
      });
      
      haptic.success();
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleReport = async (type: ReportType, message?: string) => {
    if (!currentQuestion) return;
    
    setIsReporting(true);
    try {
      await api.reports.create({
        question_id: currentQuestion.question_id,
        report_type: type,
        message,
      });
      haptic.success();
    } catch (error) {
      console.error('Failed to submit report:', error);
      haptic.error();
    } finally {
      setIsReporting(false);
    }
  };

  if (isLoading) {
    return <FullPageLoading />;
  }

  if (staleError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold mb-2">جلسه منقضی شد</h2>
          <p className="text-sm text-muted-foreground mb-4">
            برخی سوالات این جلسه دیگر در دسترس نیستند. لطفاً جلسه جدیدی شروع کنید.
          </p>
          <Button onClick={() => navigate('/')} className="gradient-primary text-primary-foreground">
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">جلسه یافت نشد</p>
          <Button onClick={() => navigate('/')} variant="link" className="mt-2">
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      <main className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        <QuestionCard
          question={currentQuestion}
          questionNumber={session.current_index + 1}
          totalQuestions={session.question_ids.length}
          isBookmarked={bookmarkedQuestions.has(currentQuestion.question_id)}
          onAnswer={handleAnswer}
          onDontKnow={handleDontKnow}
          onBookmarkToggle={handleBookmarkToggle}
          onReport={() => setShowReportModal(true)}
          result={currentResult}
          selectedIndex={selectedIndex}
          isSubmitting={isSubmitting}
        />

        {/* Next button */}
        {currentResult && (
          <div className="mt-4 animate-slide-up">
            <Button
              onClick={handleNext}
              className="w-full h-12 gradient-primary text-primary-foreground tap-highlight"
            >
              {session.current_index + 1 >= session.question_ids.length ? 'پایان' : 'بعدی'}
            </Button>
          </div>
        )}
      </main>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        isSubmitting={isReporting}
      />
    </div>
  );
}
