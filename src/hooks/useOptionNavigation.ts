import { useState, useEffect, useCallback } from 'react';
import type { Option } from '../types';

interface UseOptionNavigationOptions {
  options: Option[];
  hasOther: boolean;
  hasNext: boolean;
  onSelect: (value: string) => void;
  onOtherToggle: () => void;
  onNext: () => void;
  enabled?: boolean;
}

export function useOptionNavigation({
  options,
  hasOther,
  hasNext,
  onSelect,
  onOtherToggle,
  onNext,
  enabled = true,
}: UseOptionNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Total navigable items: options + Other (if enabled) + Next (if enabled)
  const totalItems = options.length + (hasOther ? 1 : 0) + (hasNext ? 1 : 0);

  // Index positions
  const otherIndex = hasOther ? options.length : -1;
  const nextIndex = options.length + (hasOther ? 1 : 0);

  // Reset focused index when options change
  useEffect(() => {
    setFocusedIndex(0);
  }, [options.length]);

  const selectFocused = useCallback(() => {
    if (focusedIndex < options.length) {
      onSelect(options[focusedIndex].value);
    } else if (hasOther && focusedIndex === otherIndex) {
      onOtherToggle();
    } else if (hasNext && focusedIndex === nextIndex) {
      onNext();
    }
  }, [focusedIndex, options, hasOther, hasNext, otherIndex, nextIndex, onSelect, onOtherToggle, onNext]);

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
          setFocusedIndex((prev) => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
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
  }, [enabled, totalItems, selectFocused]);

  return {
    focusedIndex,
    setFocusedIndex,
    nextIndex,
  };
}
