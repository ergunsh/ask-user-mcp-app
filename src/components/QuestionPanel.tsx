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
  focusedIndex?: number;
}

export function QuestionPanel({
  config,
  selection,
  onSelect,
  onOtherToggle,
  onOtherChange,
  focusedIndex,
}: QuestionPanelProps) {
  const otherIsFocused = focusedIndex !== undefined && focusedIndex === config.options.length;

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
    </div>
  );
}
