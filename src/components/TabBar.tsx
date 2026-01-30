import type { QuestionConfig } from '../types';

interface TabBarProps {
  questions: QuestionConfig[];
  activeTab: string; // question text or 'submit'
  answeredQuestions: Set<string>; // Set of question texts
  onTabChange: (questionOrSubmit: string) => void;
}

export function TabBar({ questions, activeTab, answeredQuestions, onTabChange }: TabBarProps) {
  const allTabs = [...questions.map(q => ({ type: 'question' as const, question: q })), { type: 'submit' as const }];

  return (
    <div className="flex flex-wrap items-center gap-1 mb-4">
      {/* Tabs */}
      {allTabs.map((tab) => {
        if (tab.type === 'submit') {
          const isActive = activeTab === 'submit';
          return (
            <button
              key="submit"
              onClick={() => onTabChange('submit')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                ${isActive
                  ? 'bg-primary/10 text-primary border-2 border-primary'
                  : 'text-text-secondary hover:bg-surface-secondary border-2 border-transparent'
                }
              `}
            >
              {/* Checkmark icon for submit */}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Submit</span>
            </button>
          );
        }

        const { question } = tab;
        const isActive = activeTab === question.question;
        const isAnswered = answeredQuestions.has(question.question);

        return (
          <button
            key={question.question}
            onClick={() => onTabChange(question.question)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors
              ${isActive
                ? 'bg-primary/10 text-primary border-2 border-primary'
                : 'text-text-secondary hover:bg-surface-secondary border-2 border-transparent'
              }
            `}
          >
            {/* Checkbox icon */}
            <span className={`
              w-4 h-4 flex items-center justify-center border-2 rounded-sm flex-shrink-0
              ${isAnswered ? 'bg-primary border-primary' : 'border-current'}
            `}>
              {isAnswered && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span>{question.header}</span>
          </button>
        );
      })}
    </div>
  );
}
