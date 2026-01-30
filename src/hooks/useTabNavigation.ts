import { useEffect, useCallback } from 'react';
import type { QuestionConfig } from '../types';

interface UseTabNavigationOptions {
  questions: QuestionConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  enabled?: boolean;
}

export function useTabNavigation({
  questions,
  activeTab,
  onTabChange,
  enabled = true,
}: UseTabNavigationOptions) {
  const getAllTabs = useCallback(() => {
    return [...questions.map(q => q.question), 'submit'];
  }, [questions]);

  const navigateTab = useCallback((direction: 'next' | 'prev') => {
    const tabs = getAllTabs();
    const currentIndex = tabs.indexOf(activeTab);

    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % tabs.length;
      onTabChange(tabs[nextIndex]);
    } else {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      onTabChange(tabs[prevIndex]);
    }
  }, [getAllTabs, activeTab, onTabChange]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab / Shift+Tab to navigate between tabs - should work even when focused on input
      if (e.key === 'Tab') {
        e.preventDefault();
        navigateTab(e.shiftKey ? 'prev' : 'next');
        return;
      }

      // Don't handle other keys if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Left/Right arrow keys to navigate tabs
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateTab('prev');
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateTab('next');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, navigateTab]);

  return {
    navigateTab,
    getAllTabs,
  };
}
