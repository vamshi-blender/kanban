export type Id = string | number;

export type Column = {
  id: Id;
  title: string;
  isHighlighted?: boolean;
};

export type IssueType = 'Feature' | 'Improvement' | 'Bug' | 'Task';

export type Task = {
  id: Id;
  columnId: Id;
  content: string;
  rowData?: Record<string, any>;
  issueType?: IssueType;
  issueId?: string;
  assignee?: string;
  summary?: string;
};

export type ExcelRow = {
  [key: string]: string | number;
  Status: string;
};

export type BookmarkState = 0 | 1 | 2;

export type BookmarkFilter = 0 | 1 | 2;

export interface TaskBookmarks {
  [key: string]: BookmarkState;
}