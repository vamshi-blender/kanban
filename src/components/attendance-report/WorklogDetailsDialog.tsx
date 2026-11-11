import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { WorklogEntry } from '../../services/attendanceReport';

interface Props {
  date: string;
  entries: WorklogEntry[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export default function WorklogDetailsDialog({ date, entries, loading, error, onClose, onRetry }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={dialogRef} aria-labelledby="worklog-details-title" onCancel={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl border border-[#2D3139] bg-[#181b21] p-0 text-white shadow-2xl backdrop:bg-black/70">
      <div className="flex items-center justify-between border-b border-[#2D3139] px-5 py-4">
        <h2 id="worklog-details-title" className="text-lg font-semibold">Worklogs for {date}</h2>
        <button type="button" onClick={onClose} autoFocus aria-label="Close worklog details" className="rounded-lg p-2 hover:bg-[#2D3139]">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[65vh] overflow-auto p-5">
        {loading ? <p role="status" className="text-gray-400">Loading worklogs…</p> : error ? (
          <div role="alert"><p className="text-rose-400">{error}</p><button type="button" onClick={onRetry} className="mt-3 rounded-full bg-rose-500 px-4 py-1.5 text-sm">Retry</button></div>
        ) : entries.length === 0 ? <p className="text-gray-400">No worklogs found for {date}.</p> : (
          <>
            <p className="mb-4 text-sm text-gray-400">{entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {Math.round(entries.reduce((hours, entry) => hours + entry.hours, 0) * 1e8) / 1e8} hours</p>
            <ul className="space-y-3">
              {entries.map((entry, index) => (
                <li key={index} className="rounded-lg border border-[#2D3139] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{entry.issueId || 'Issue unavailable'}</span>
                    <span>{entry.hours} {entry.hours === 1 ? 'hour' : 'hours'}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{entry.category || 'Category unavailable'}</p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm">{entry.description || 'No description provided.'}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </dialog>
  );
}
