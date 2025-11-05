import { useState } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { Column, Id, Task } from '../types';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Check } from 'lucide-react';
import TaskCard from './TaskCard';

interface Props {
  column: Column;
  tasks: Task[];
  onStatusCheckResult?: (taskId: Id, targetStatuses: string[]) => void;
  highlightedTaskId?: Id | null;
  successTaskId?: Id | null;
  updatingTaskId?: Id | null;
}

function parseTaskContent(content: string) {
  const lines = content.split('\n');
  const data: { issueId?: string; summary?: string } = {};

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
      }
    }
  });

  return data;
}

export default function KanbanColumn({
  column,
  tasks,
  onStatusCheckResult,
  highlightedTaskId,
  successTaskId,
  updatingTaskId,
}: Props) {
  const [isCopied, setIsCopied] = useState(false);

  // Debug logging for column highlighting
  if (column.isHighlighted) {
    console.log(`Column ${column.id} is highlighted:`, column.isHighlighted);
  }
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleCopyAll = async () => {
    const tasksList = tasks.map(task => {
      const taskData = parseTaskContent(task.content);
      return `${taskData.issueId}: ${taskData.summary}`;
    }).join('\n');

    try {
      await navigator.clipboard.writeText(tasksList);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`h-full rounded-lg flex flex-col ${
        column.isHighlighted
          ? 'border-2 border-blue-500 bg-blue-900/20'
          : 'bg-[#181b21]'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-[#2D3139] bg-[#1C1F26] rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-sm">{column.title}</h2>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0c1015] px-2 text-xs text-white border border-[#2D3139]">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={handleCopyAll}
            className="rounded p-1 hover:bg-[#181b21] transition-colors duration-200"
            title="Copy all tasks in this column"
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400 hover:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Column Content */}
      <SortableContext items={tasks.map((task) => task.id)}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 column-scroll">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusCheckResult={onStatusCheckResult}
              isHighlighted={highlightedTaskId === task.id}
              isSuccess={successTaskId === task.id}
              isUpdating={updatingTaskId === task.id}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}