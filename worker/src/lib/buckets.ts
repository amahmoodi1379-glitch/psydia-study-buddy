export const MIN_CLASSIFICATION_ATTEMPTS = 3;

const MASTERED_LAST_THREE_ACCURACY_THRESHOLD = 0.9;
const MASTERED_OVERALL_ACCURACY_THRESHOLD = 0.85;
const MASTERED_MIN_BOX = 4;
const MASTERED_MIN_INTERVAL_DAYS = 7;

const WEAK_LAST_THREE_ACCURACY_THRESHOLD = 0.34;
const WEAK_OVERALL_ACCURACY_THRESHOLD = 0.5;
const WEAK_MAX_BOX = 1;
const WEAK_MAX_INTERVAL_DAYS = 1;

export type BucketType = "mastered" | "almost" | "weak" | "insufficient";

export interface AttemptRecord {
  question_id: string | null;
  was_correct: boolean | null;
}

export function buildLastThreeMap(attempts: AttemptRecord[]) {
  const lastThree = new Map<string, boolean[]>();
  for (const attempt of attempts) {
    const questionId = attempt.question_id;
    if (!questionId) continue;
    const existing = lastThree.get(questionId) ?? [];
    if (existing.length >= 3) continue;
    existing.push(Boolean(attempt.was_correct));
    lastThree.set(questionId, existing);
  }
  return lastThree;
}

export function classifyQuestionBucket({
  totalAttempts,
  correctAttempts,
  boxNumber,
  intervalDays,
  lastThreeCorrect,
}: {
  totalAttempts: number;
  correctAttempts: number;
  boxNumber: number;
  intervalDays: number;
  lastThreeCorrect: boolean[];
}): BucketType {
  if (totalAttempts < MIN_CLASSIFICATION_ATTEMPTS) return "insufficient";

  const accuracy = totalAttempts ? correctAttempts / totalAttempts : 0;
  const lastThreeAccuracy = lastThreeCorrect.length
    ? lastThreeCorrect.filter(Boolean).length / lastThreeCorrect.length
    : accuracy;

  if (
    lastThreeAccuracy >= MASTERED_LAST_THREE_ACCURACY_THRESHOLD &&
    accuracy >= MASTERED_OVERALL_ACCURACY_THRESHOLD &&
    boxNumber >= MASTERED_MIN_BOX &&
    intervalDays >= MASTERED_MIN_INTERVAL_DAYS
  ) {
    return "mastered";
  }

  if (
    lastThreeAccuracy <= WEAK_LAST_THREE_ACCURACY_THRESHOLD ||
    accuracy < WEAK_OVERALL_ACCURACY_THRESHOLD ||
    boxNumber <= WEAK_MAX_BOX ||
    intervalDays <= WEAK_MAX_INTERVAL_DAYS
  ) {
    return "weak";
  }

  return "almost";
}
