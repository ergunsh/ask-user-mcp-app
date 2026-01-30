interface SubmitButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function SubmitButton({ disabled, onClick }: SubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      autoFocus
      className={`
        w-full p-3 text-left rounded-lg border-2 transition-all duration-150
        hover:border-primary/50 hover:bg-surface-secondary
        focus:outline-none focus:ring-2 focus:ring-primary/30
        ${disabled
          ? 'border-border bg-surface text-text-secondary cursor-not-allowed'
          : 'border-primary bg-primary/5'
        }
      `}
    >
      <div className={`font-medium ${disabled ? 'text-text-secondary' : 'text-text-primary'}`}>
        Review & Submit
      </div>
    </button>
  );
}
