import { useState } from 'react';
import { Bookmark, Flag, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { LoadingSpinner } from './LoadingSpinner';
import type { SessionQuestion, SubmitAnswerSuccessResponse } from '@/api/types';

interface QuestionCardProps {
  question: SessionQuestion;
  questionNumber: number;
  totalQuestions: number;
  isBookmarked: boolean;
  onAnswer: (choiceIndex: 0 | 1 | 2 | 3) => Promise<void>;
  onDontKnow: () => Promise<void>;
  onBookmarkToggle: () => void;
  onReport: () => void;
  result?: SubmitAnswerSuccessResponse;
  selectedIndex?: number;
  isSubmitting: boolean;
}

const choiceLabels = ['الف', 'ب', 'ج', 'د'];

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  isBookmarked,
  onAnswer,
  onDontKnow,
  onBookmarkToggle,
  onReport,
  result,
  selectedIndex,
  isSubmitting,
}: QuestionCardProps) {
  const hasAnswered = result !== undefined;
  const progress = ((questionNumber) / totalQuestions) * 100;

  const getChoiceClass = (index: number) => {
    if (!hasAnswered) {
      return 'choice-default hover:border-primary/50';
    }

    if (index === result.correct_choice_index) {
      return 'choice-correct';
    }

    if (index === selectedIndex && !result.was_correct) {
      return 'choice-incorrect';
    }

    return 'choice-default opacity-50';
  };

  const handleChoiceClick = async (index: 0 | 1 | 2 | 3) => {
    if (hasAnswered || isSubmitting) return;
    haptic.medium();
    await onAnswer(index);
  };

  const handleDontKnow = async () => {
    if (hasAnswered || isSubmitting) return;
    haptic.light();
    await onDontKnow();
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Progress bar */}
      <div className="h-1 bg-secondary mb-4 rounded-full overflow-hidden">
        <div 
          className="h-full gradient-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          سوال {questionNumber} از {totalQuestions}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              haptic.light();
              onBookmarkToggle();
            }}
            className={cn(
              'p-2 rounded-full transition-colors',
              isBookmarked ? 'text-warning' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-current')} />
          </button>
          <button
            onClick={() => {
              haptic.light();
              onReport();
            }}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Question stem */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <p className="text-base leading-relaxed">{question.stem_text}</p>
        </div>

        {/* Choices */}
        <div className="space-y-3 mb-4">
          {question.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleChoiceClick(index as 0 | 1 | 2 | 3)}
              disabled={hasAnswered || isSubmitting}
              className={cn(
                'w-full flex items-start gap-3 p-4 rounded-xl border text-right transition-all tap-highlight',
                getChoiceClass(index),
                isSubmitting && 'opacity-70'
              )}
            >
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
                hasAnswered && index === result.correct_choice_index
                  ? 'bg-success text-success-foreground'
                  : hasAnswered && index === selectedIndex && !result.was_correct
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-secondary text-muted-foreground'
              )}>
                {choiceLabels[index]}
              </span>
              <span className="flex-1 text-sm">{choice}</span>
              {isSubmitting && index === selectedIndex && (
                <LoadingSpinner size="sm" />
              )}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {hasAnswered && result.explanation_text && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4 animate-slide-up">
            <h4 className="text-sm font-medium text-primary mb-2">توضیح</h4>
            <p className="text-sm text-foreground/80">{result.explanation_text}</p>
          </div>
        )}
      </div>

      {/* Don't know button */}
      {!hasAnswered && (
        <button
          onClick={handleDontKnow}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border-t border-border"
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <HelpCircle className="w-4 h-4" />
              <span>نمی‌دانم / نمایش پاسخ</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
