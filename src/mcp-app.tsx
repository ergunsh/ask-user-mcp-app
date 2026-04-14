import { StrictMode, useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import { TabBar, SubmitTab, QuestionPanel } from './components';
import { useTabNavigation } from './hooks/useTabNavigation';
import { useOptionNavigation } from './hooks/useOptionNavigation';
import { useWindowFocus } from './hooks/useWindowFocus';
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
  const [isMobile, setIsMobile] = useState(false);

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

      // Handle context changes from host
      app.onhostcontextchanged = (params) => {
        if (params.theme) {
          setTheme(params.theme);
        }
        if (params.platform !== undefined) {
          setIsMobile(params.platform === 'mobile');
        }
        if (params.deviceCapabilities !== undefined) {
          const { touch, hover } = params.deviceCapabilities;
          if (touch !== undefined || hover !== undefined) {
            setIsMobile(touch === true && hover === false);
          }
        }
      };
    },
  });

  // Apply host context on initial connection
  useEffect(() => {
    if (app && isConnected) {
      const context = app.getHostContext();
      if (context?.theme) {
        setTheme(context.theme);
      }
      if (context?.platform === 'mobile') {
        setIsMobile(true);
      } else if (context?.deviceCapabilities) {
        const { touch, hover } = context.deviceCapabilities;
        if (touch === true && hover === false) {
          setIsMobile(true);
        }
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

      // Auto-navigate to next tab for single-select (non-multiSelect) questions
      const nextTab = activeQuestion.multiSelect ? prev.activeTab : getNextTab(prev.activeTab);

      return {
        ...prev,
        answers: newAnswers,
        answeredQuestions: newAnsweredQuestions,
        activeTab: nextTab,
      };
    });
  }, [questions, getNextTab]);

  // Handle next button - navigate to next tab
  const handleNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeTab: getNextTab(prev.activeTab),
    }));
  }, [getNextTab]);

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

  const { focusedIndex, nextIndex } = useOptionNavigation({
    options: activeQuestion?.options ?? [],
    hasOther: activeQuestion?.allowOther ?? false,
    hasNext: true,
    onSelect: handleSelect,
    onOtherToggle: handleOtherToggle,
    onNext: handleNext,
    enabled: viewState === 'selecting' && !isOnSubmitTab && !!activeQuestion,
  });

  // Track window focus - only show focus outlines when window is actually focused
  // On mobile (touch devices), hide focus outlines since tap interaction doesn't need them
  const isWindowFocused = useWindowFocus();
  const effectiveFocusedIndex = isMobile ? undefined : (isWindowFocused ? focusedIndex : undefined);

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80px] p-4">
        <div className="text-red-500 text-sm">Connection error. Please try again.</div>
      </div>
    );
  }

  // Loading state
  if (!isConnected || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[80px] p-4">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  // Compact "ready" state - shows selected answer with option to edit
  if (viewState === 'ready') {
    return (
      <div className="p-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-success-bg border border-success/20">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary mb-1">Answers ready to send</div>
            <div className="text-sm text-text-secondary leading-relaxed">
              {buildResponse().split('\n').map((line, i) => (
                <div key={i} className="truncate">{line}</div>
              ))}
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-accent hover:text-accent-hover rounded-lg hover:bg-accent-muted transition-colors"
          >
            Edit
          </button>
        </div>
        <p className="mt-2 text-xs text-text-muted text-center">
          Press Enter in chat to send your response
        </p>
      </div>
    );
  }

  // Selection state - tab interface
  return (
    <div className="p-4">
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
          onNext={handleNext}
          focusedIndex={effectiveFocusedIndex}
          nextIndex={nextIndex}
          isLastQuestion={questions.indexOf(activeQuestion) === questions.length - 1}
        />
      ) : null}

      {!isMobile && (
        <p className="mt-4 text-xs text-text-muted text-center">
          Use arrow keys to navigate, Enter to select
        </p>
      )}
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
