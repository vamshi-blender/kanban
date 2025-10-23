import { useState, useEffect } from 'react';
import { Id, Task, IssueType, BookmarkState } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UserCircle, Copy, Check, Bookmark, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { useUserPhotos } from '../context/UserPhotosContext';
import { checkTaskStatus } from '../services/api';

interface Props {
  task: Task;
  deleteTask?: (id: Id) => void;
  onStatusCheckResult?: (taskId: Id, targetStatuses: string[]) => void;
  isHighlighted?: boolean;
  isSuccess?: boolean;
  isUpdating?: boolean;
}

function getIssueTypeColor(type: IssueType | undefined) {
  switch(type?.toLowerCase()) {
    case 'feature':
      return 'bg-blue-500';
    case 'improvement':
      return 'bg-green-500';
    case 'bug':
      return 'bg-red-500';
    case 'task':
      return 'bg-violet-500';
    default:
      return 'bg-gray-500';
  }
}

function getBookmarkColor(state: BookmarkState) {
  switch(state) {
    case 1:
      return 'text-yellow-500 fill-yellow-500';
    case 2:
      return 'text-rose-500 fill-rose-500';
    default:
      return 'text-gray-400';
  }
}

function parseTaskContent(content: string) {
  const lines = content.split('\n');
  const data: Partial<Task> = {};
  
  lines.forEach(line => {
    const [key, value] = line.split(': ');
    if (key && value) {
      switch(key.trim()) {
        case 'Issue Id':
          data.issueId = value.trim();
          break;
        case 'Summary':
          data.summary = value.trim();
          break;
        case 'Issue Type':
          data.issueType = value.trim() as IssueType;
          break;
        case 'Assignee':
          data.assignee = value.trim();
          break;
      }
    }
  });
  
  return data;
}

export default function TaskCard({ task, onStatusCheckResult, isHighlighted, isSuccess, isUpdating }: Props) {
  const [isCopied, setIsCopied] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { getUserPhoto, loadUserPhoto } = useUserPhotos();
  const taskData = parseTaskContent(task.content);
  const [bookmarkState, setBookmarkState] = useState<BookmarkState>(() => {
    const bookmarks = JSON.parse(localStorage.getItem('taskBookmarks') || '{}');
    return (bookmarks[taskData.issueId || ''] as BookmarkState) || 0;
  });

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  useEffect(() => {
    if (taskData.assignee) {
      loadUserPhoto(taskData.assignee);
    }
  }, [taskData.assignee, loadUserPhoto]);

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleCopy = async () => {
    const textToCopy = `${taskData.issueId}: ${taskData.summary}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleBookmark = () => {
    const newState = (bookmarkState + 1) % 3 as BookmarkState;
    setBookmarkState(newState);

    const bookmarks = JSON.parse(localStorage.getItem('taskBookmarks') || '{}');
    if (taskData.issueId) {
      if (newState === 0) {
        delete bookmarks[taskData.issueId];
      } else {
        bookmarks[taskData.issueId] = newState;
      }
      localStorage.setItem('taskBookmarks', JSON.stringify(bookmarks));
    }
  };

  const handleStatusCheck = async () => {
    if (!taskData.issueType || !task.columnId) {
      console.error('Missing required data for status check:', { issueType: taskData.issueType, currentStatus: task.columnId });
      return;
    }

    setIsCheckingStatus(true);

    try {
      const response = await checkTaskStatus(taskData.issueType, task.columnId as string);
      console.log('Status check response:', response);

      // Parse the API response to extract target statuses
      if (response.results) {
        try {
          console.log('Raw API response.results:', response.results);
          const parsedResults = JSON.parse(response.results);
          console.log('Parsed API results:', parsedResults);
          const targetStatuses: string[] = [];

          if (Array.isArray(parsedResults)) {
            parsedResults.forEach((item: any) => {
              console.log('Processing item:', item);
              if (item.AppData && typeof item.AppData === 'string') {
                targetStatuses.push(item.AppData);
                console.log('Added target status:', item.AppData);
              }
            });
          }

          console.log('Final extracted target statuses:', targetStatuses);
          console.log('onStatusCheckResult callback exists:', !!onStatusCheckResult);
          console.log('Task ID:', task.id);

          // Call the callback to update the kanban board
          if (onStatusCheckResult && targetStatuses.length > 0) {
            console.log('Calling onStatusCheckResult with:', task.id, targetStatuses);
            onStatusCheckResult(task.id, targetStatuses);
          } else {
            console.log('Not calling callback - onStatusCheckResult:', !!onStatusCheckResult, 'targetStatuses.length:', targetStatuses.length);
          }
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError);
        }
      } else {
        console.log('No response.results found');
      }
    } catch (error) {
      console.error('Failed to check task status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative cursor-grab rounded-xl border-2 border-rose-500 bg-[#0c1015] opacity-30"
      />
    );
  }

  const userPhoto = taskData.assignee ? getUserPhoto(taskData.assignee) : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} rounded-xl bg-[#0c1015] overflow-hidden w-[300px] ${
        isUpdating ? 'ring-2 ring-inset ring-blue-500 opacity-75' :
        isHighlighted ? 'ring-2 ring-inset ring-blue-500' :
        isSuccess ? 'ring-2 ring-inset ring-green-500' :
        'hover:ring-2 hover:ring-inset hover:ring-rose-500' // Only apply hover effect when no other highlighting is active
      }`}
    >
      {/* Card Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs font-mono">{taskData.issueId}</span>
            {isUpdating && (
              <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full text-white ${getIssueTypeColor(taskData.issueType)}`}>
              {taskData.issueType}
            </span>
            <button
              onClick={toggleBookmark}
              className="hover:scale-110 transition-transform duration-200"
            >
              <Bookmark
                size={16}
                className={`${getBookmarkColor(bookmarkState)} transition-colors duration-200`}
              />
            </button>
          </div>
        </div>
        <h3 className="text-white font-medium text-sm">{taskData.summary}</h3>
      </div>
      
      {/* Card Footer */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={taskData.assignee}
              className="w-5 h-5 rounded-full mr-2 object-cover"
            />
          ) : (
            <UserCircle size={20} className="text-gray-400 mr-2" />
          )}
          <span className="text-gray-400 text-xs">{taskData.assignee}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusCheck();
            }}
            disabled={isCheckingStatus}
            className="rounded p-1 hover:bg-[#181b21] transition-colors duration-200 disabled:opacity-50"
            title="Check Next Status"
          >
            {isCheckingStatus ? (
              <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <ArrowLeftRight className="h-4 w-4 text-gray-400 hover:text-white" />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="rounded p-1 hover:bg-[#181b21] transition-colors duration-200"
            title="Copy Issue ID and Summary"
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400 hover:text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}