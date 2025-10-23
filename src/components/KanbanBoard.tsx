import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { Column, Id, Task, IssueType, BookmarkFilter } from '../types';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { statusOrder, getStatusOrder, isValidStatus } from '../config/statusConfig';
import KanbanFilters from './KanbanFilters';
import { fetchTasks, updateTaskStatus } from '../services/api';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";

// Sprint name persistence utilities
const SPRINT_NAME_KEY = 'kanban_sprint_name';
const DEFAULT_SPRINT_NAME = 'DAP - 26';

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

const getSavedSearchValue = (): string => {
  try {
    return localStorage.getItem(SEARCH_VALUE_KEY) || '';
  } catch (error) {
    console.error('Error loading search value from localStorage:', error);
    return '';
  }
};

export default function KanbanBoard() {
  const { instance } = useMsal();
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<IssueType[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [bookmarkFilter, setBookmarkFilter] = useState<BookmarkFilter>(0);
  const [searchValue, setSearchValue] = useState(() => getSavedSearchValue());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<Id | null>(null);
  const [successTaskId, setSuccessTaskId] = useState<Id | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<Id | null>(null);
  const [originalColumnId, setOriginalColumnId] = useState<Id | null>(null);

  useEffect(() => {
    // Load tasks with saved sprint name on initial load
    loadTaskData(getSavedSprintName());
  }, []);

  const loadTaskData = async (sprintName?: string) => {
    try {
      setError(null);
      setShowError(false);

      // Clear all highlighting when refreshing tasks
      setHighlightedTaskId(null);
      setSuccessTaskId(null);
      setColumns(prevColumns =>
        prevColumns.map(col => ({ ...col, isHighlighted: false }))
      );

      const fetchedTasks = await fetchTasks(sprintName);

      // Get unique valid status values from API data
      const uniqueStatuses = Array.from(new Set(fetchedTasks.map(task =>
        task.rowData?.Status as string
      ))).filter(status => statusOrder.includes(status));

      // Create columns for valid statuses and add "Other Status" column
      const newColumns = [
        ...uniqueStatuses.map(status => ({
          id: status,
          title: status,
          isHighlighted: false
        })),
        {
          id: 'Other Status',
          title: 'Other Status',
          isHighlighted: false
        }
      ].sort((a, b) => getStatusOrder(a.id as string) - getStatusOrder(b.id as string));

      setColumns(newColumns);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error loading task data:', error);
      setError('Failed to load tasks. Please try again later.');
      setShowError(true);
    } finally {
      setIsInitialLoad(false);
    }
  };

  const handleStatusCheckResult = (taskId: Id, targetStatuses: string[]) => {
    console.log('handleStatusCheckResult called with:', { taskId, targetStatuses });
    console.log('Current columns before processing:', columns.map(col => ({ id: col.id, title: col.title, isHighlighted: col.isHighlighted })));

    // Clear any existing highlighting first
    setHighlightedTaskId(null);
    setSuccessTaskId(null); // Clear success highlighting to ensure blue highlighting takes priority
    setColumns(prevColumns =>
      prevColumns.map(col => ({ ...col, isHighlighted: false }))
    );

    // Use setTimeout to ensure highlighting is applied after clearing
    setTimeout(() => {
      // Highlight the source task
      setHighlightedTaskId(taskId);
      console.log('Set highlighted task ID to:', taskId);

      // Process target statuses
      setColumns(prevColumns => {
        const newColumns = [...prevColumns];
        const existingColumnIds = new Set(newColumns.map(col => col.id));
        console.log('Existing column IDs:', Array.from(existingColumnIds));

        // Create missing columns and highlight all target columns
        targetStatuses.forEach(status => {
          console.log('Processing target status:', status);
          if (!existingColumnIds.has(status)) {
            console.log('Creating new column for status:', status);
            // Create new column for missing status
            const newColumn: Column = {
              id: status,
              title: status,
              isHighlighted: true
            };

            // Insert in correct position based on status order
            const insertIndex = newColumns.findIndex(col =>
              getStatusOrder(status) < getStatusOrder(col.id as string)
            );

            if (insertIndex === -1) {
              newColumns.push(newColumn);
            } else {
              newColumns.splice(insertIndex, 0, newColumn);
            }
            existingColumnIds.add(status);
          } else {
            console.log('Column already exists for status:', status);
          }
        });

        // Highlight existing columns that match target statuses
        newColumns.forEach(column => {
          const columnId = column.id as string;
          const shouldHighlight = targetStatuses.includes(columnId);
          console.log(`Column comparison - ID: "${columnId}", Target statuses: [${targetStatuses.map(s => `"${s}"`).join(', ')}], shouldHighlight: ${shouldHighlight}`);
          column.isHighlighted = shouldHighlight;
        });

        console.log('Final columns after processing:', newColumns.map(col => ({ id: col.id, title: col.title, isHighlighted: col.isHighlighted })));
        return newColumns;
      });
    }, 10); // Small delay to ensure state updates are processed
  };

  const clearHighlighting = () => {
    console.log('clearHighlighting called');
    setHighlightedTaskId(null);
    setSuccessTaskId(null);
    setColumns(prevColumns => {
      const updatedColumns = prevColumns.map(col => ({ ...col, isHighlighted: false }));
      console.log('Cleared highlighting for columns:', updatedColumns.map(col => ({ id: col.id, isHighlighted: col.isHighlighted })));
      return updatedColumns;
    });
  };

  const handleLogin = () => {
    instance.loginPopup(loginRequest).then(() => {
      setShowAuthPopup(false);
      console.log('Login successful');
    }).catch(e => {
      console.error("Login failed:", e);
      setShowAuthPopup(false);
    });
  };

  const handleAuthCancel = () => {
    setShowAuthPopup(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') {
      const task = event.active.data.current.task;
      setActiveTask(task);
      setOriginalColumnId(task.columnId);
      console.log('Drag started - Task:', task.rowData?.['Issue Id'], 'Original Column:', task.columnId);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
          tasks[activeIndex].columnId = tasks[overIndex].columnId;
          return arrayMove(tasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Dropping a Task over a Column
    const isOverAColumn = over.data.current?.type === 'Column';

    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);

        tasks[activeIndex].columnId = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      setOriginalColumnId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      setOriginalColumnId(null);
      return;
    }

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) {
      setOriginalColumnId(null);
      return;
    }

    // Find the task that was moved
    const movedTask = tasks.find(t => t.id === activeId);
    if (!movedTask) {
      setOriginalColumnId(null);
      return;
    }

    let newColumnId: string;

    // Determine the new column ID
    if (isOverATask) {
      const targetTask = tasks.find(t => t.id === overId);
      if (!targetTask) {
        setOriginalColumnId(null);
        return;
      }
      newColumnId = targetTask.columnId as string;
    } else if (isOverAColumn) {
      newColumnId = overId as string;
    } else {
      setOriginalColumnId(null);
      return;
    }

    // Only make API call if the status actually changed (compare with original column ID)
    console.log('Drag end - Original Column:', originalColumnId, 'New Column:', newColumnId, 'Should update:', originalColumnId && originalColumnId !== newColumnId);

    if (originalColumnId && originalColumnId !== newColumnId) {
      try {
        console.log(`Updating task ${movedTask.rowData?.['Issue Id']} from ${originalColumnId} to ${newColumnId}`);

        // Set updating state for visual feedback
        setUpdatingTaskId(activeId);

        // Call the API to update the task status
        await updateTaskStatus(movedTask, newColumnId);

        console.log('Task status updated successfully');

        // Update the task's rowData to reflect the new status
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeId
              ? {
                  ...task,
                  rowData: {
                    ...task.rowData,
                    Status: newColumnId
                  }
                }
              : task
          )
        );

        // Show success highlighting (green) for the task
        setHighlightedTaskId(null); // Clear blue highlighting
        setSuccessTaskId(activeId); // Set green highlighting

        // Clear column highlighting
        setColumns(prevColumns =>
          prevColumns.map(col => ({ ...col, isHighlighted: false }))
        );

      } catch (error) {
        console.error('Failed to update task status:', error);

        // Manually revert the task to its original position instead of reloading
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeId
              ? {
                  ...task,
                  columnId: originalColumnId, // Revert to original column
                  rowData: {
                    ...task.rowData,
                    Status: originalColumnId // Revert status in rowData too
                  }
                }
              : task
          )
        );

        // Handle authentication errors with custom popup
        if (error instanceof Error && error.message === 'AUTHENTICATION_REQUIRED') {
          console.log('Authentication required - showing login popup');
          setShowAuthPopup(true);
        } else {
          // For other errors, show the error overlay
          setError(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setShowError(true);
        }
      } finally {
        // Clear updating state
        setUpdatingTaskId(null);

        // Note: Don't clear highlighting here as success highlighting should persist
        // and error highlighting is handled in the catch block
      }
    }

    // Clear original column ID
    setOriginalColumnId(null);
  }

  // Filter tasks based on selected filters, bookmarks, and search
  const filteredTasks = tasks.filter(task => {
    const taskData = typeof task.rowData === 'object' ? task.rowData : {};

    // Issue Type filter
    const matchesIssueType = selectedIssueTypes.length === 0 ||
      selectedIssueTypes.includes(taskData['Issue Type'] as IssueType);

    // Assignee filter
    const matchesAssignee = selectedAssignees.length === 0 ||
      selectedAssignees.includes(taskData['Assignee'] as string);

    // Bookmark filter
    const bookmarks = JSON.parse(localStorage.getItem('taskBookmarks') || '{}');
    const taskBookmarkState = bookmarks[taskData['Issue Id'] as string] || 0;
    const matchesBookmark = bookmarkFilter === 0 || taskBookmarkState === bookmarkFilter;

    // Search filter - search across Issue ID, Summary, and Assignee
    const matchesSearch = !searchValue.trim() || (() => {
      const searchTerm = searchValue.toLowerCase().trim();
      const issueId = (taskData['Issue Id'] as string || '').toLowerCase();
      const summary = (taskData['Summary'] as string || '').toLowerCase();
      const assignee = (taskData['Assignee'] as string || '').toLowerCase();

      return issueId.includes(searchTerm) ||
             summary.includes(searchTerm) ||
             assignee.includes(searchTerm);
    })();

    return matchesIssueType && matchesAssignee && matchesBookmark && matchesSearch;
  });

  return (
    <div className="h-screen flex flex-col">
      {/* Loading Overlay - Only shown during initial load */}
      {isInitialLoad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      )}

      {/* Error Overlay */}
      {showError && error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center bg-[#181b21] p-6 rounded-lg shadow-xl border border-[#2D3139]">
            <p className="text-rose-500 mb-4">{error}</p>
            <button
              onClick={() => setShowError(false)}
              className="px-4 py-2 bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Authentication Required Popup */}
      {showAuthPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center bg-[#181b21] p-6 rounded-lg shadow-xl border border-[#2D3139]">
            <p className="text-rose-500 mb-4">Please log in with your Microsoft account to update task status.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors text-white"
              >
                Login
              </button>
              <button
                onClick={handleAuthCancel}
                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <KanbanFilters
        tasks={tasks}
        selectedIssueTypes={selectedIssueTypes}
        selectedAssignees={selectedAssignees}
        onIssueTypeChange={setSelectedIssueTypes}
        onAssigneeChange={setSelectedAssignees}
        bookmarkFilter={bookmarkFilter}
        onBookmarkFilterChange={setBookmarkFilter}
        onRefresh={loadTaskData}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filteredTasksCount={filteredTasks.length}
      />
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div
          className="flex-1 overflow-x-auto overflow-y-hidden p-4 hide-scrollbar"
          onClick={(e) => {
            // Only clear highlighting if clicking on the background, not on columns or tasks
            if (e.target === e.currentTarget) {
              clearHighlighting();
            }
          }}
        >
          <div className="flex gap-4">
            {columns.map((col) => {
              const columnTasks = filteredTasks.filter((task) => task.columnId === col.id);
              return (
                <div key={col.id} className="flex flex-col h-[calc(100vh-5.5rem)] min-h-[400px] w-[350px]">
                  <KanbanColumn
                    column={col}
                    tasks={columnTasks}
                    onStatusCheckResult={handleStatusCheckResult}
                    highlightedTaskId={highlightedTaskId}
                    successTaskId={successTaskId}
                    updatingTaskId={updatingTaskId}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {createPortal(
          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                onStatusCheckResult={handleStatusCheckResult}
                isHighlighted={highlightedTaskId === activeTask.id}
                isSuccess={successTaskId === activeTask.id}
                isUpdating={updatingTaskId === activeTask.id}
              />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}