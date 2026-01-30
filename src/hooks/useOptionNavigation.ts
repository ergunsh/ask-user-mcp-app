import { useState, useEffect, useCallback } from 'react';
import type { Option } from '../types';

interface UseOptionNavigationOptions {
  options: Option[];
  hasOther: boolean;
  onSelect: (value: string) => void;
  onOtherToggle: () => void;
  enabled?: boolean;
}

export function useOptionNavigation({
  options,
  hasOther,
  onSelect,
  onOtherToggle,
  enabled = true,
}: UseOptionNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const totalOptions = options.length + (hasOther ? 1 : 0);

  // Reset focused index when options change
  useEffect(() => {
    setFocusedIndex(0);
  }, [options.length]);

  const selectFocused = useCallback(() => {
    if (focusedIndex < options.length) {
      onSelect(options[focusedIndex].value);
    } else if (hasOther) {
      onOtherToggle();
    }
  }, [focusedIndex, options, hasOther, onSelect, onOtherToggle]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % totalOptions);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          selectFocused();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, totalOptions, selectFocused]);

  return {
    focusedIndex,
    setFocusedIndex,
  };
}
