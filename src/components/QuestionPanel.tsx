import type { QuestionConfig, SelectionState } from '../types';
import { QuestionHeader } from './QuestionHeader';
import { OptionList } from './OptionList';
import { OtherInput } from './OtherInput';

interface QuestionPanelProps {
  config: QuestionConfig;
  selection: SelectionState;
  onSelect: (value: string) => void;
  onOtherToggle: () => void;
  onOtherChange: (value: string) => void;
  onNext: () => void;
  focusedIndex?: number;
  nextIndex: number;
  isLastQuestion?: boolean;
}

export function QuestionPanel({
  config,
  selection,
  onSelect,
  onOtherToggle,
  onOtherChange,
  onNext,
  focusedIndex,
  nextIndex,
  isLastQuestion,
}: QuestionPanelProps) {
  const otherIndex = config.allowOther ? config.options.length : -1;
  const otherIsFocused = focusedIndex !== undefined && focusedIndex === otherIndex;
  const nextIsFocused = focusedIndex !== undefined && focusedIndex === nextIndex;

  return (
    <div>
      <QuestionHeader header={config.header} question={config.question} />

      <OptionList
        options={config.options}
        selected={selection.selected}
        multiSelect={config.multiSelect}
        onSelect={onSelect}
        focusedIndex={focusedIndex !== undefined && focusedIndex < config.options.length ? focusedIndex : undefined}
      />

      {config.allowOther && (
        <OtherInput
          isSelected={selection.isOtherSelected}
          value={selection.otherText}
          multiSelect={config.multiSelect}
          onToggle={onOtherToggle}
          onChange={onOtherChange}
          focused={otherIsFocused}
        />
      )}

      {/* Next button styled like an option but without checkbox */}
      <button
        type="button"
        onClick={onNext}
        className={`
          mt-2 w-full p-3 text-left rounded-lg border-2 transition-all duration-150
          hover:border-primary/50 hover:bg-surface-secondary
          focus:outline-none focus:ring-2 focus:ring-primary/30
          border-border bg-surface
          ${nextIsFocused ? 'ring-2 ring-primary/50' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {/* Arrow icon instead of checkbox */}
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <span className="font-medium text-text-primary">
            {isLastQuestion ? 'Review & Submit' : 'Next'}
          </span>
        </div>
      </button>
    </div>
  );
}
