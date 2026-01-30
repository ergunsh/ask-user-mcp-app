import { useEffect } from 'react';
import type { QuestionConfig, SelectionState } from '../types';
import { SubmitButton } from './SubmitButton';

interface SubmitTabProps {
  questions: QuestionConfig[];
  answers: Map<string, SelectionState>;
  onSubmit: () => void;
}

function formatAnswer(config: QuestionConfig, selection: SelectionState | undefined): string {
  if (!selection) return 'Not answered';

  const parts: string[] = [];

  // Add selected options
  selection.selected.forEach((value) => {
    const option = config.options.find((o) => o.value === value);
    if (option) parts.push(option.label);
  });

  // Add "Other" response
  if (selection.isOtherSelected && selection.otherText.trim()) {
    parts.push(selection.otherText.trim());
  }

  return parts.length > 0 ? parts.join(', ') : 'Not answered';
}

function hasValidAnswer(selection: SelectionState | undefined): boolean {
  if (!selection) return false;
  return selection.selected.size > 0 || (selection.isOtherSelected && selection.otherText.trim().length > 0);
}

export function SubmitTab({ questions, answers, onSubmit }: SubmitTabProps) {
  // Check if all required questions have valid answers
  const requiredUnanswered = questions.filter(
    q => q.required && !hasValidAnswer(answers.get(q.question))
  );

  const canSubmit = requiredUnanswered.length === 0;

  // Handle Enter key to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSubmit, onSubmit]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Review your answers</h3>
        <p className="text-sm text-text-muted">Make sure everything looks correct before submitting.</p>
      </div>

      <div className="space-y-2">
        {questions.map((q, index) => {
          const selection = answers.get(q.question);
          const isAnswered = hasValidAnswer(selection);
          const isRequired = q.required && !isAnswered;

          return (
            <div
              key={q.question}
              className={`
                p-3 rounded-xl border
                ${isRequired
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30'
                  : 'bg-surface-elevated border-border-subtle'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-secondary mb-0.5">
                    {q.question}
                    {q.required && !isAnswered && (
                      <span className="ml-1.5 text-red-500 text-xs">Required</span>
                    )}
                  </div>
                  <div className={`
                    text-base
                    ${isAnswered ? 'text-text-primary' : 'text-text-muted italic'}
                  `}>
                    {formatAnswer(q, selection)}
                  </div>
                </div>
                {isAnswered && (
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {requiredUnanswered.length > 0 && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Please answer required questions: {requiredUnanswered.map(q => q.question).join(', ')}
        </p>
      )}

      <SubmitButton disabled={!canSubmit} onClick={onSubmit} />
    </div>
  );
}
