import { StrictMode, useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import { TabBar, SubmitTab, QuestionPanel } from './components';
import { useTabNavigation } from './hooks/useTabNavigation';
import { useOptionNavigation } from './hooks/useOptionNavigation';
import type { QuestionConfig, SelectionState, MultiQuestionState } from './types';
import './styles/app.css';

type ViewState = 'selecting' | 'ready';

function AskUserApp() {
  const [questions, setQuestions] = useState<QuestionConfig[]>([]);
  const [state, setState] = useState<MultiQuestionState>({
    answers: new Map(),
    activeTab: '',
    answeredQuestions: new Set(),
  });
  const [viewState, setViewState] = useState<ViewState>('selecting');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'ask-user-mcp-app', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      // Register notification handler for tool input
      app.ontoolinput = (params) => {
        const args = params.arguments as {
          questions: Array<{
            question: string;
            header: string;
            options: Array<{ label: string; value: string; description?: string }>;
            multiSelect?: boolean;
            allowOther?: boolean;
            required?: boolean;
          }>;
        };

        const questionsConfig: QuestionConfig[] = args.questions.map((q) => ({
          question: q.question,
          header: q.header,
          options: q.options,
          multiSelect: q.multiSelect ?? false,
          allowOther: q.allowOther ?? true,
          required: q.required ?? false,
        }));

        setQuestions(questionsConfig);
        setState({
          answers: new Map(),
          activeTab: questionsConfig[0]?.question ?? '',
          answeredQuestions: new Set(),
        });
        setViewState('selecting');
      };

      // Handle theme changes from host
      app.onhostcontextchanged = (params) => {
        if (params.theme) {
          setTheme(params.theme);
        }
      };
    },
  });

  // Apply theme from host context on initial connection
  useEffect(() => {
    if (app && isConnected) {
      const context = app.getHostContext();
      if (context?.theme) {
        setTheme(context.theme);
      }
    }
  }, [app, isConnected]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Get active question config
  const activeQuestion = questions.find((q) => q.question === state.activeTab);

  // Get current selection for active question
  const currentSelection: SelectionState = state.answers.get(state.activeTab) ?? {
    selected: new Set(),
    otherText: '',
    isOtherSelected: false,
  };

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  // Get next tab in sequence
  const getNextTab = useCallback((currentTab: string) => {
    const currentIndex = questions.findIndex((q) => q.question === currentTab);
    if (currentIndex === -1) return 'submit';
    if (currentIndex < questions.length - 1) {
      return questions[currentIndex + 1].question;
    }
    return 'submit';
  }, [questions]);

  // Handle option selection
  const handleSelect = useCallback((value: string) => {
    setState((prev) => {
      const activeQuestion = questions.find((q) => q.question === prev.activeTab);
      if (!activeQuestion) return prev;

      const currentAnswer = prev.answers.get(prev.activeTab) ?? {
        selected: new Set<string>(),
        otherText: '',
        isOtherSelected: false,
      };

      const newSelected = new Set(currentAnswer.selected);

      if (activeQuestion.multiSelect) {
        // Multi-select: toggle selection
        if (newSelected.has(value)) {
          newSelected.delete(value);
        } else {
          newSelected.add(value);
        }
      } else {
        // Single-select: replace selection
        newSelected.clear();
        newSelected.add(value);
      }

      const newAnswer = {
        ...currentAnswer,
        selected: newSelected,
        // Deselect "Other" when selecting a regular option in single-select mode
        isOtherSelected: activeQuestion.multiSelect ? currentAnswer.isOtherSelected : false,
      };

      const newAnswers = new Map(prev.answers);
      newAnswers.set(prev.activeTab, newAnswer);

      // Update answered questions
      const newAnsweredQuestions = new Set(prev.answeredQuestions);
      if (newAnswer.selected.size > 0 || (newAnswer.isOtherSelected && newAnswer.otherText.trim().length > 0)) {
        newAnsweredQuestions.add(prev.activeTab);
      } else {
        newAnsweredQuestions.delete(prev.activeTab);
      }

      // Auto-navigate to next tab for single-select
      const nextTab = activeQuestion.multiSelect ? prev.activeTab : getNextTab(prev.activeTab);

      return {
        ...prev,
        answers: newAnswers,
        answeredQuestions: newAnsweredQuestions,
        activeTab: nextTab,
      };
    });
  }, [questions, getNextTab]);

  // Handle "Other" toggle
  const handleOtherToggle = useCallback(() => {
    setState((prev) => {
      const activeQuestion = questions.find((q) => q.question === prev.activeTab);
      if (!activeQuestion) return prev;

      const currentAnswer = prev.answers.get(prev.activeTab) ?? {
        selected: new Set<string>(),
        otherText: '',
        isOtherSelected: false,
      };

      const newIsOtherSelected = !currentAnswer.isOtherSelected;

      let newAnswer: SelectionState;
      if (activeQuestion.multiSelect) {
        // Multi-select: just toggle "Other"
        newAnswer = { ...currentAnswer, isOtherSelected: newIsOtherSelected };
      } else {
        // Single-select: deselect other options when selecting "Other"
        newAnswer = {
          selected: newIsOtherSelected ? new Set() : currentAnswer.selected,
          otherText: currentAnswer.otherText,
          isOtherSelected: newIsOtherSelected,
        };
      }

      const newAnswers = new Map(prev.answers);
      newAnswers.set(prev.activeTab, newAnswer);

      // Update answered questions
      const newAnsweredQuestions = new Set(prev.answeredQuestions);
      if (newAnswer.selected.size > 0 || (newAnswer.isOtherSelected && newAnswer.otherText.trim().length > 0)) {
        newAnsweredQuestions.add(prev.activeTab);
      } else {
        newAnsweredQuestions.delete(prev.activeTab);
      }

      return {
        ...prev,
        answers: newAnswers,
        answeredQuestions: newAnsweredQuestions,
      };
    });
  }, [questions]);

  // Handle "Other" text change
  const handleOtherChange = useCallback((value: string) => {
    setState((prev) => {
      const currentAnswer = prev.answers.get(prev.activeTab) ?? {
        selected: new Set<string>(),
        otherText: '',
        isOtherSelected: false,
      };

      const newAnswer = { ...currentAnswer, otherText: value };
      const newAnswers = new Map(prev.answers);
      newAnswers.set(prev.activeTab, newAnswer);

      // Update answered questions
      const newAnsweredQuestions = new Set(prev.answeredQuestions);
      if (newAnswer.selected.size > 0 || (newAnswer.isOtherSelected && newAnswer.otherText.trim().length > 0)) {
        newAnsweredQuestions.add(prev.activeTab);
      } else {
        newAnsweredQuestions.delete(prev.activeTab);
      }

      return {
        ...prev,
        answers: newAnswers,
        answeredQuestions: newAnsweredQuestions,
      };
    });
  }, []);

  // Build response text in "question -> answer" format
  const buildResponse = useCallback(() => {
    const responses: string[] = [];

    questions.forEach((q) => {
      const answer = state.answers.get(q.question);
      if (!answer) return;

      const parts: string[] = [];

      // Add selected options
      answer.selected.forEach((value) => {
        const option = q.options.find((o) => o.value === value);
        if (option) parts.push(option.label);
      });

      // Add "Other" response
      if (answer.isOtherSelected && answer.otherText.trim()) {
        parts.push(`Other: ${answer.otherText.trim()}`);
      }

      if (parts.length > 0) {
        responses.push(`${q.question} -> ${parts.join(', ')}`);
      }
    });

    return responses.join('\n');
  }, [questions, state.answers]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!app) return;

    const response = buildResponse();

    try {
      // Send message to chat input
      await app.sendMessage({
        role: 'user',
        content: [{ type: 'text', text: response }],
      });

      // Switch to compact "ready" view
      setViewState('ready');
    } catch (err) {
      console.error('Failed to send response:', err);
    }
  }, [app, buildResponse]);

  // Handle edit - go back to selection view
  const handleEdit = useCallback(() => {
    setViewState('selecting');
  }, []);

  // Keyboard navigation - only enabled when not in submit tab
  const isOnSubmitTab = state.activeTab === 'submit';

  useTabNavigation({
    questions,
    activeTab: state.activeTab,
    onTabChange: handleTabChange,
    enabled: viewState === 'selecting',
  });

  const { focusedIndex } = useOptionNavigation({
    options: activeQuestion?.options ?? [],
    hasOther: activeQuestion?.allowOther ?? false,
    onSelect: handleSelect,
    onOtherToggle: handleOtherToggle,
    enabled: viewState === 'selecting' && !isOnSubmitTab && !!activeQuestion,
  });

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[100px] p-4">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  // Loading state
  if (!isConnected || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[100px] p-4">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  // Compact "ready" state - shows selected answer with option to edit
  if (viewState === 'ready') {
    return (
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-text-secondary truncate">
              {buildResponse().replace(/\n/g, ' | ')}
            </span>
          </div>
          <button
            onClick={handleEdit}
            className="flex-shrink-0 px-3 py-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Edit
          </button>
        </div>
        <p className="mt-1 text-xs text-text-secondary opacity-70">
          Press Enter in chat to send, or click Edit to change
        </p>
      </div>
    );
  }

  // Selection state - tab interface
  return (
    <div className="p-4 max-w-md mx-auto">
      <TabBar
        questions={questions}
        activeTab={state.activeTab}
        answeredQuestions={state.answeredQuestions}
        onTabChange={handleTabChange}
      />

      {state.activeTab === 'submit' ? (
        <SubmitTab
          questions={questions}
          answers={state.answers}
          onSubmit={handleSubmit}
        />
      ) : activeQuestion ? (
        <QuestionPanel
          config={activeQuestion}
          selection={currentSelection}
          onSelect={handleSelect}
          onOtherToggle={handleOtherToggle}
          onOtherChange={handleOtherChange}
          focusedIndex={focusedIndex}
        />
      ) : null}

      <p className="mt-4 text-xs text-text-secondary text-center">
        Enter to select &middot; Tab/Arrow keys to navigate &middot; Esc to cancel
      </p>
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <AskUserApp />
    </StrictMode>
  );
}
