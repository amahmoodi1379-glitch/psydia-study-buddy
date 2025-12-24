export const MIN_CLASSIFICATION_ATTEMPTS = 3;

export type BucketType = "mastered" | "almost" | "weak" | "insufficient";

export function buildLastThreeMap(attempts: any[]) {
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

  if (lastThreeAccuracy >= 0.9 && accuracy >= 0.85 && boxNumber >= 4 && intervalDays >= 7) {
    return "mastered";
  }

  if (lastThreeAccuracy <= 0.34 || accuracy < 0.5 || boxNumber <= 1 || intervalDays <= 1) {
    return "weak";
  }

  return "almost";
}
