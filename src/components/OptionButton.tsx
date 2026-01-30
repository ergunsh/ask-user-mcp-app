import type { Option } from '../types';

interface OptionButtonProps {
  option: Option;
  isSelected: boolean;
  multiSelect: boolean;
  onSelect: (value: string) => void;
  focused?: boolean;
}

export function OptionButton({ option, isSelected, multiSelect, onSelect, focused }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={`
        w-full p-3 text-left rounded-lg border-2 transition-all duration-150
        hover:border-primary/50 hover:bg-surface-secondary
        focus:outline-none focus:ring-2 focus:ring-primary/30
        ${isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-surface'
        }
        ${focused ? 'ring-2 ring-primary/50' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <div className={`
          mt-0.5 flex-shrink-0 w-5 h-5
          border-2 flex items-center justify-center transition-colors
          ${multiSelect ? 'rounded-sm' : 'rounded-full'}
          ${isSelected
            ? 'border-primary bg-primary'
            : 'border-text-secondary'
          }
        `}>
          {isSelected && (
            multiSelect ? (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-2 h-2 bg-white rounded-full" />
            )
          )}
        </div>

        {/* Option content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary">{option.label}</div>
          {option.description && (
            <div className="mt-1 text-sm text-text-secondary">{option.description}</div>
          )}
        </div>
      </div>
    </button>
  );
}
