interface OtherInputProps {
  isSelected: boolean;
  value: string;
  multiSelect: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  focused?: boolean;
}

export function OtherInput({ isSelected, value, multiSelect, onToggle, onChange, focused }: OtherInputProps) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
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
        <div className="flex items-center gap-3">
          {/* Selection indicator */}
          <div className={`
            flex-shrink-0 w-5 h-5
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

          <span className="font-medium text-text-primary">Other</span>
        </div>
      </button>

      {/* Text input shown when "Other" is selected */}
      {isSelected && (
        <div className="mt-2 ml-8">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer..."
            autoFocus
            className="
              w-full px-3 py-2 rounded-lg border-2 border-border
              bg-surface text-text-primary placeholder-text-secondary
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30
              transition-colors
            "
          />
        </div>
      )}
    </div>
  );
}
