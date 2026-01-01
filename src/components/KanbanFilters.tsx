import { useState, useRef, useEffect, useCallback } from 'react';
import { Task, IssueType, BookmarkFilter } from '../types';
import { Search, X, Bookmark, PenLine, RefreshCw, Check, XCircle, ListRestart, Key } from 'lucide-react';
import UserAvatar from './UserAvatar';
import NotesEditor from './NotesEditor';
import { saveApiKey, getApiKeyStatus, validateApiKeyFormat } from '../utils/apiKeyManager';

// Sprint name persistence utilities
const SPRINT_NAME_KEY = 'kanban_sprint_name';
const SPRINT_NAME_HISTORY_KEY = 'kanban_sprint_name_history';
const DEFAULT_SPRINT_NAME = 'DAP - 26';
const MAX_SPRINT_HISTORY = 10;

// Search persistence utilities
const SEARCH_VALUE_KEY = 'kanban_search_value';

const getSavedSprintName = (): string => {
  try {
    return localStorage.getItem(SPRINT_NAME_KEY) || DEFAULT_SPRINT_NAME;
  } catch (error) {
    console.error('Error loading sprint name from localStorage:', error);
    return DEFAULT_SPRINT_NAME;
  }
};

const saveSprintName = (sprintName: string): void => {
  try {
    localStorage.setItem(SPRINT_NAME_KEY, sprintName);
  } catch (error) {
    console.error('Error saving sprint name to localStorage:', error);
  }
};

const getSprintNameHistory = (): string[] => {
  try {
    const saved = localStorage.getItem(SPRINT_NAME_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [DEFAULT_SPRINT_NAME];
  } catch (error) {
    console.error('Error loading sprint name history from localStorage:', error);
    return [DEFAULT_SPRINT_NAME];
  }
};

const saveSprintNameHistory = (history: string[]): void => {
  try {
    localStorage.setItem(SPRINT_NAME_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving sprint name history to localStorage:', error);
  }
};

const addToSprintNameHistory = (sprintName: string): void => {
  if (!sprintName.trim()) return;

  const history = getSprintNameHistory();
  const filteredHistory = history.filter(name => name !== sprintName);
  const newHistory = [sprintName, ...filteredHistory].slice(0, MAX_SPRINT_HISTORY);
  saveSprintNameHistory(newHistory);
};

const getSavedSearchValue = (): string => {
  try {
    return localStorage.getItem(SEARCH_VALUE_KEY) || '';
  } catch (error) {
    console.error('Error loading search value from localStorage:', error);
    return '';
  }
};

const saveSearchValue = (searchValue: string): void => {
  try {
    localStorage.setItem(SEARCH_VALUE_KEY, searchValue);
  } catch (error) {
    console.error('Error saving search value to localStorage:', error);
  }
};

interface Props {
  tasks: Task[];
  selectedIssueTypes: IssueType[];
  selectedAssignees: string[];
  onIssueTypeChange: (types: IssueType[]) => void;
  onAssigneeChange: (assignees: string[]) => void;
  bookmarkFilter: BookmarkFilter;
  onBookmarkFilterChange: (filter: BookmarkFilter) => void;
  onRefresh: (sprintName: string) => Promise<void>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filteredTasksCount: number;
}

function getBookmarkFilterColor(filter: BookmarkFilter) {
  switch(filter) {
    case 1:
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 2:
      return 'bg-rose-500 hover:bg-rose-600';
    default:
      return 'bg-[#181b21] hover:bg-[#1C1F26]';
  }
}

export default function KanbanFilters({
  tasks,
  selectedIssueTypes,
  selectedAssignees,
  onIssueTypeChange,
  onAssigneeChange,
  bookmarkFilter,
  onBookmarkFilterChange,
  onRefresh,
  searchValue,
  onSearchChange,
  filteredTasksCount
}: Props) {
  const [issueTypeDropdownOpen, setIssueTypeDropdownOpen] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sprintName, setSprintName] = useState(() => getSavedSprintName());
  const [sprintNameDropdownOpen, setSprintNameDropdownOpen] = useState(false);
  const [sprintNameHistory, setSprintNameHistory] = useState<string[]>(() => getSprintNameHistory());
  const [isSprintNameHovered, setIsSprintNameHovered] = useState(false);
  const [sprintNameInputChanged, setSprintNameInputChanged] = useState(false);

  // API Key management state
  const [isApiKeyExpanded, setIsApiKeyExpanded] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState(() => getApiKeyStatus());
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const issueTypeRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const sprintNameRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isIssueTypeHovered, setIsIssueTypeHovered] = useState(false);
  const [isAssigneeHovered, setIsAssigneeHovered] = useState(false);

  // Search component state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  // Debounced search handler
  const debouncedSearchChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onSearchChange(value);
          saveSearchValue(value);
        }, 300);
      };
    })(),
    [onSearchChange]
  );

  // Sync local search value with prop when it changes externally
  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  const uniqueIssueTypes = Array.from(new Set(tasks.map(task => {
    if (task.rowData && typeof task.rowData === 'object') {
      const issueType = task.rowData['Issue Type'];
      return issueType && typeof issueType === 'string' ? issueType as IssueType : null;
    }
    return null;
  }).filter((type): type is IssueType => type !== null)))
  .sort((a, b) => a.localeCompare(b));

  const uniqueAssignees = Array.from(new Set(tasks.map(task => {
    if (task.rowData && typeof task.rowData === 'object') {
      const assignee = task.rowData['Assignee'];
      return assignee && typeof assignee === 'string' ? assignee : null;
    }
    return null;
  }).filter((assignee): assignee is string => assignee !== null)))
  .sort((a, b) => a.localeCompare(b));

  const filteredAssignees = uniqueAssignees.filter(assignee =>
    assignee.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (issueTypeRef.current && !issueTypeRef.current.contains(event.target as Node)) {
        setIssueTypeDropdownOpen(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setAssigneeDropdownOpen(false);
      }
      if (sprintNameRef.current && !sprintNameRef.current.contains(event.target as Node)) {
        setSprintNameDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize search expansion state based on saved search value
  useEffect(() => {
    if (localSearchValue.trim()) {
      setIsSearchExpanded(true);
    }
  }, []);

  const handleSprintNameChange = (newSprintName: string) => {
    setSprintName(newSprintName);
    saveSprintName(newSprintName);
    setSprintNameInputChanged(true);
  };

  const handleSprintNameSelect = async (selectedName: string) => {
    setSprintName(selectedName);
    saveSprintName(selectedName);
    setSprintNameDropdownOpen(false);
    setIsSprintNameHovered(false);
    setSprintNameInputChanged(false);
    addToSprintNameHistory(selectedName);
    setSprintNameHistory(getSprintNameHistory());

    // Call API refresh with the new sprint name
    await handleRefresh(selectedName);
  };

  const handleSprintNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addToSprintNameHistory(sprintName);
      setSprintNameHistory(getSprintNameHistory());
      handleRefresh();
    }
  };

  const handleRefresh = async (customSprintName?: string) => {
    setIsRefreshing(true);
    setRefreshError(null);
    setShowSuccess(false);

    try {
      await onRefresh(customSprintName || sprintName);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  // API Key management functions
  const handleApiKeyClick = () => {
    if (apiKeyStatus.hasKey) {
      // If key exists, show expanded state with current masked key
      setApiKeyInput('');
      setIsApiKeyExpanded(true);
    } else {
      // If no key, expand for input
      setIsApiKeyExpanded(true);
    }
    setApiKeyError(null);
  };

  const handleApiKeySubmit = () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError('Please enter an API key');
      return;
    }

    if (!validateApiKeyFormat(apiKeyInput.trim())) {
      setApiKeyError('Invalid API key format');
      return;
    }

    try {
      saveApiKey(apiKeyInput.trim());
      setApiKeyStatus(getApiKeyStatus());
      setApiKeyInput('');
      setIsApiKeyExpanded(false);
      setApiKeyError(null);
      console.log('API key saved successfully');
    } catch (error) {
      setApiKeyError(error instanceof Error ? error.message : 'Failed to save API key');
    }
  };

  const handleApiKeyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApiKeySubmit();
    } else if (e.key === 'Escape') {
      setIsApiKeyExpanded(false);
      setApiKeyInput('');
      setApiKeyError(null);
    }
  };

  const handleApiKeyBlur = () => {
    // Delay collapse to allow for button clicks
    setTimeout(() => {
      if (!apiKeyInput.trim()) {
        setIsApiKeyExpanded(false);
        setApiKeyError(null);
      }
    }, 150);
  };

  const handleIssueTypeSelectAll = () => {
    if (selectedIssueTypes.length === uniqueIssueTypes.length) {
      onIssueTypeChange([]);
    } else {
      onIssueTypeChange([...uniqueIssueTypes]);
    }
  };

  const handleAssigneeSelectAll = () => {
    if (selectedAssignees.length === uniqueAssignees.length) {
      onAssigneeChange([]);
    } else {
      onAssigneeChange([...uniqueAssignees]);
    }
  };

  const handleBookmarkFilterClick = () => {
    onBookmarkFilterChange(((bookmarkFilter + 1) % 3) as BookmarkFilter);
  };

  // Effect to handle search collapse logic
  useEffect(() => {
    // Check if search should be collapsed
    const shouldCollapse = !isSearchFocused && !isSearchHovered && !localSearchValue.trim();

    if (shouldCollapse && isSearchExpanded) {
      // Add a small delay to prevent flickering when transitioning between states
      const timeoutId = setTimeout(() => {
        setIsSearchExpanded(false);
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [isSearchFocused, isSearchHovered, localSearchValue, isSearchExpanded]);

  // Search component handlers
  const handleSearchMouseEnter = () => {
    setIsSearchHovered(true);
    setIsSearchExpanded(true);
  };

  const handleSearchMouseLeave = () => {
    setIsSearchHovered(false);
    // The useEffect will handle collapse logic
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    // The useEffect will handle collapse logic
  };

  const handleSearchChange = (value: string) => {
    // Update local state immediately for UI responsiveness
    setLocalSearchValue(value);

    // Debounced function will handle the actual search logic
    debouncedSearchChange(value);

    // Keep expanded if there's a value
    if (value.trim()) {
      setIsSearchExpanded(true);
    }
    // The useEffect will handle collapse logic when value becomes empty
  };

  return (
    <>
      <div className="flex gap-4 items-center justify-end py-2 px-4 bg-[#000] border-b border-[#181b21]">
        {/* Total Tasks Count with Sprint Name and Refresh Button */}
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-white text-sm">
            {localSearchValue.trim() || selectedIssueTypes.length > 0 || selectedAssignees.length > 0 || bookmarkFilter > 0
              ? 'Filtered Tasks:'
              : 'Total Tasks:'}
          </span>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#181b21] px-2 text-xs text-white border border-[#2D3139]">
            {filteredTasksCount}
          </span>
          {(localSearchValue.trim() || selectedIssueTypes.length > 0 || selectedAssignees.length > 0 || bookmarkFilter > 0) && (
            <span className="text-gray-400 text-xs">
              of {tasks.length}
            </span>
          )}

          {/* Sprint Name with Dropdown */}
          <div
            ref={sprintNameRef}
            className="relative"
            onMouseEnter={() => setIsSprintNameHovered(true)}
            onMouseLeave={() => {
              setIsSprintNameHovered(false);
              if (!sprintNameDropdownOpen) {
                setTimeout(() => {
                  if (!isSprintNameHovered) {
                    setSprintNameDropdownOpen(false);
                  }
                }, 100);
              }
            }}
          >
            <input
              type="text"
              value={sprintName}
              onChange={(e) => handleSprintNameChange(e.target.value)}
              onKeyDown={handleSprintNameKeyPress}
              onFocus={() => {
                setSprintNameDropdownOpen(true);
                setSprintNameInputChanged(false);
              }}
              className="bg-[#181b21] text-white px-3 py-1 rounded-lg border border-[#2D3139] text-sm focus:outline-none focus:border-rose-500 w-[90px]"
              placeholder="Sprint Name"
            />

            {/* Sprint Name Dropdown */}
            <div
              className={`absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg z-20 bg-[#181b21] bg-opacity-70 backdrop-blur-md
              transition-all duration-300 ease-in-out ${(sprintNameDropdownOpen || isSprintNameHovered) ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}`}
              style={{ transitionProperty: 'opacity, max-height' }}
            >
              <div className="p-2 max-h-60 overflow-y-auto column-scroll">
                {sprintNameHistory
                  .filter(name => !sprintNameInputChanged || name.toLowerCase().includes(sprintName.toLowerCase()))
                  .sort((a, b) => a.localeCompare(b))
                  .map((name, index) => (
                    <div
                      key={index}
                      onClick={() => handleSprintNameSelect(name)}
                      className="flex items-center p-2 hover:bg-[#2D3139] rounded cursor-pointer"
                    >
                      <span className="text-sm text-white">{name}</span>
                    </div>
                  ))}
                {sprintNameHistory.filter(name => !sprintNameInputChanged || name.toLowerCase().includes(sprintName.toLowerCase())).length === 0 && (
                  <div className="p-2 text-sm text-gray-400 text-center">
                    No matching sprint names
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className={`
              p-2 rounded-full transition-colors duration-200 relative group
              ${refreshError ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#181b21] hover:bg-[#1C1F26]'}
              text-white
            `}
            title={refreshError || 'Refresh tasks'}
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : showSuccess ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : refreshError ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <ListRestart className="w-4 h-4" />
            )}

            {/* Error Tooltip */}
            {refreshError && (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 transform translate-y-full w-48 bg-rose-500 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                {refreshError}
              </div>
            )}
          </button>

          {/* API Key Management */}
          <div className="relative flex items-center">
            {/* API Key Button/Input Container */}
            <div className={`
              flex items-center rounded-full transition-all duration-300 ease-in-out
              ${isApiKeyExpanded
                ? 'bg-[#181b21] border border-[#2D3139] px-3 py-1'
                : 'bg-[#181b21] hover:bg-[#1C1F26]'
              }
              ${apiKeyStatus.hasKey ? 'ring-1 ring-green-500/30' : ''}
            `}>
              {/* Key Icon Button */}
              <button
                onClick={handleApiKeyClick}
                className={`
                  p-2 rounded-full transition-colors duration-200 text-white
                  ${!isApiKeyExpanded ? 'hover:bg-[#1C1F26]' : ''}
                  ${apiKeyStatus.hasKey ? 'text-green-400' : ''}
                `}
                title={apiKeyStatus.hasKey ? `API Key: ${apiKeyStatus.maskedKey}` : 'Set API Key'}
              >
                <Key className="w-4 h-4" />
              </button>

              {/* API Key Input - Only render when expanded */}
              {isApiKeyExpanded && (
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={handleApiKeyKeyPress}
                  onBlur={handleApiKeyBlur}
                  placeholder={apiKeyStatus.hasKey ? "Enter new API key..." : "Enter your API key..."}
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none min-w-[200px]"
                  autoFocus
                />
              )}
            </div>

            {/* API Key Error Display */}
            {apiKeyError && (
              <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-rose-500 text-white text-xs rounded shadow-lg whitespace-nowrap z-30">
                {apiKeyError}
              </div>
            )}
          </div>
        </div>

        {/* Search Component */}
        <div
          className="relative flex items-center"
          onMouseEnter={handleSearchMouseEnter}
          onMouseLeave={handleSearchMouseLeave}
        >
          <div
            className={`
              flex items-center transition-all duration-300 ease-in-out
              ${isSearchExpanded ? 'w-[300px] h-[32px]' : 'w-8 h-8'}
              bg-[#181b21] hover:bg-[#1C1F26] rounded-full
              border border-transparent hover:border-[#2D3139]
            `}
          >
            {/* Search Icon */}
            <div className="p-2 flex-shrink-0">
              <Search
                size={16}
                className="transition-transform duration-200 hover:scale-110"
              />
            </div>

            {/* Search Input - Only render when expanded */}
            {isSearchExpanded && (
              <input
                ref={searchInputRef}
                type="text"
                value={localSearchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Search by Issue ID, Summary, Assignee..."
                className={`
                  flex-1 bg-transparent text-white text-sm placeholder-gray-400
                  focus:outline-none transition-all duration-300 ease-in-out
                  ${localSearchValue.trim() ? 'pr-8' : 'pr-4'}
                `}
                style={{
                  transition: 'opacity 300ms ease-in-out, width 300ms ease-in-out'
                }}
              />
            )}

            {/* Clear Search Button */}
            {localSearchValue.trim() && isSearchExpanded && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2 p-1 text-gray-400 hover:text-white transition-colors duration-200"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Notes Button */}
        <button
          onClick={() => setIsNotesOpen(true)}
          className="p-2 rounded-full transition-colors duration-200 text-white bg-[#181b21] hover:bg-[#1C1F26]"
          title="Open Notes"
        >
          <PenLine
            size={16}
            className="transition-transform duration-200 hover:scale-110"
          />
        </button>

        {/* Bookmark Filter */}
        <button
          onClick={handleBookmarkFilterClick}
          className={`
            p-2 rounded-full transition-colors duration-200
            text-white ${getBookmarkFilterColor(bookmarkFilter)}
          `}
          title={bookmarkFilter === 0 ? 'Filter bookmarks' : bookmarkFilter === 1 ? 'Show yellow bookmarks' : 'Show red bookmarks'}
        >
          <Bookmark
            size={16}
            className={`${bookmarkFilter > 0 ? 'fill-white' : ''} transition-transform duration-200 hover:scale-110`}
          />
        </button>

        {/* Issue Type Filter */}
        <div
          ref={issueTypeRef}
          className="relative"
          onMouseEnter={() => setIsIssueTypeHovered(true)}
          onMouseLeave={() => {
            setIsIssueTypeHovered(false);
            if (!issueTypeDropdownOpen) {
              setTimeout(() => {
                if (!isIssueTypeHovered) {
                  setIssueTypeDropdownOpen(false);
                }
              }, 100);
            }
          }}
        >
          <button
            onClick={() => setIssueTypeDropdownOpen(!issueTypeDropdownOpen)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200
              ${selectedIssueTypes.length > 0
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-[#181b21] text-white hover:bg-[#1C1F26]'}
            `}
          >
            Issue Type {selectedIssueTypes.length > 0 && `(${selectedIssueTypes.length})`}
          </button>

          {/* Issue Type Dropdown */}
          <div
            className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg z-20 bg-[#181b21] bg-opacity-70 backdrop-blur-md
            transition-all duration-300 ease-in-out ${(issueTypeDropdownOpen || isIssueTypeHovered) ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}`}
            style={{ transitionProperty: 'opacity, max-height' }}
          >
            <div className="p-2">
              <label className="flex items-center p-2 hover:bg-[#2D3139] rounded cursor-pointer border-b border-[#2D3139]">
                <input
                  type="checkbox"
                  checked={selectedIssueTypes.length === uniqueIssueTypes.length}
                  onChange={handleIssueTypeSelectAll}
                  className="mr-2"
                />
                <span className="text-sm text-white font-medium">Select All</span>
              </label>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto column-scroll">
              {uniqueIssueTypes.map(type => (
                <label key={type} className="flex items-center p-2 hover:bg-[#2D3139] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIssueTypes.includes(type)}
                    onChange={() => {
                      const newTypes = selectedIssueTypes.includes(type)
                        ? selectedIssueTypes.filter(t => t !== type)
                        : [...selectedIssueTypes, type];
                      onIssueTypeChange(newTypes);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-white">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Assignee Filter */}
        <div
          ref={assigneeRef}
          className="relative"
          onMouseEnter={() => setIsAssigneeHovered(true)}
          onMouseLeave={() => {
            setIsAssigneeHovered(false);
            if (!assigneeDropdownOpen) {
              setTimeout(() => {
                if (!isAssigneeHovered) {
                  setAssigneeDropdownOpen(false);
                }
              }, 100);
            }
          }}
        >
          <button
            onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200
              ${selectedAssignees.length > 0
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-[#181b21] text-white hover:bg-[#1C1F26]'}
            `}
          >
            Assignee {selectedAssignees.length > 0 && `(${selectedAssignees.length})`}
          </button>

          {/* Assignee Dropdown */}
          <div
            className={`absolute top-full right-0 mt-2 w-80 rounded-lg shadow-lg z-20 bg-[#181b21] bg-opacity-70 backdrop-blur-md
            transition-all duration-300 ease-in-out ${(assigneeDropdownOpen || isAssigneeHovered) ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}`}
            style={{ transitionProperty: 'opacity, max-height' }}
          >
            <div className="p-2">
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search assignees..."
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  className="w-full bg-[#0c1015] border border-[#2D3139] rounded-full px-3 py-1.5 pl-8 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {assigneeSearch && (
                  <button
                    type="button"
                    onClick={() => setAssigneeSearch('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <label className="flex items-center p-2 hover:bg-[#2D3139] rounded cursor-pointer border-b border-[#2D3139]">
                <input
                  type="checkbox"
                  checked={selectedAssignees.length === uniqueAssignees.length}
                  onChange={handleAssigneeSelectAll}
                  className="mr-2"
                />
                <span className="text-sm text-white font-medium">Select All</span>
              </label>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto column-scroll">
              {filteredAssignees.map(assignee => (
                <label key={assignee} className="flex items-center p-2 hover:bg-[#2D3139] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAssignees.includes(assignee)}
                    onChange={() => {
                      const newAssignees = selectedAssignees.includes(assignee)
                        ? selectedAssignees.filter(a => a !== assignee)
                        : [...selectedAssignees, assignee];
                      onAssigneeChange(newAssignees);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-white">{assignee}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* User Avatar */}
        <UserAvatar />
      </div>

      {/* Notes Editor Modal */}
      <NotesEditor isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} />
    </>
  );
}