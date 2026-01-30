import { useEffect } from 'react';
import type { QuestionConfig, SelectionState } from '../types';
import { SubmitButton } from './SubmitButton';

interface SubmitTabProps {
  questions: QuestionConfig[];
  answers: Map<string, SelectionState>;
  onSubmit: () => void;
}

function formatAnswer(config: QuestionConfig, selection: SelectionState | undefined): string {
  if (!selection) return 'Skipped';

  const parts: string[] = [];

  // Add selected options
  selection.selected.forEach((value) => {
    const option = config.options.find((o) => o.value === value);
    if (option) parts.push(option.label);
  });

  // Add "Other" response
  if (selection.isOtherSelected && selection.otherText.trim()) {
    parts.push(`Other: ${selection.otherText.trim()}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Skipped';
}

function formatQuestionAnswer(config: QuestionConfig, selection: SelectionState | undefined): string {
  const answer = formatAnswer(config, selection);
  return `${config.question} -> ${answer}`;
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
      <h3 className="text-sm font-medium text-text-secondary">Review Your Answers</h3>

      <div className="space-y-2">
        {questions.map((q) => {
          const selection = answers.get(q.question);
          const isSkipped = !hasValidAnswer(selection);
          const isRequired = q.required && isSkipped;

          return (
            <div key={q.question} className={`
              text-sm
              ${isRequired ? 'text-red-500' : isSkipped ? 'text-text-secondary italic' : 'text-text'}
            `}>
              {formatQuestionAnswer(q, selection)}
              {q.required && isSkipped && <span className="text-red-500"> (required)</span>}
            </div>
          );
        })}
      </div>

      {requiredUnanswered.length > 0 && (
        <p className="text-xs text-red-500">
          Please answer required questions: {requiredUnanswered.map(q => q.header).join(', ')}
        </p>
      )}

      <SubmitButton disabled={!canSubmit} onClick={onSubmit} />
    </div>
  );
}
