export interface Option {
  label: string;
  value: string;
  description?: string;
}

export interface QuestionConfig {
  question: string;
  header: string; // Required for tab labels
  options: Option[];
  multiSelect: boolean;
  allowOther: boolean;
  required?: boolean;
}

export interface SelectionState {
  selected: Set<string>;
  otherText: string;
  isOtherSelected: boolean;
}

export interface MultiQuestionState {
  answers: Map<string, SelectionState>; // Map<question text, SelectionState>
  activeTab: string; // question text or 'submit'
  answeredQuestions: Set<string>; // Set of question texts
}
