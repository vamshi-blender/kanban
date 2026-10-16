import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
};

const formatDisplay = (date: Date | null): string =>
  date
    ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    : '—';

type CalendarCell = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
};

const getCalendarCells = (viewDate: Date): CalendarCell[] => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startDay = new Date(year, month, 1).getDay();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(year, month, index - startDay + 1);
    cells.push({
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month
    });
  }

  return cells;
};

export default function DateRangePicker({ from, to, onChange }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const fromDate = useMemo(() => parseDateValue(from), [from]);
  const toDate = useMemo(() => parseDateValue(to), [to]);
  const [viewDate, setViewDate] = useState(() => fromDate ?? new Date());
  // First click of a new range; while set, the next click completes the range.
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (calendarOpen) {
      setViewDate(fromDate ?? new Date());
    } else {
      setPendingStart(null);
      setHoverDate(null);
    }
  }, [calendarOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!calendarOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [calendarOpen]);

  const calendarCells = useMemo(() => getCalendarCells(viewDate), [viewDate]);
  const monthLabel = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Range shown in the calendar: the in-progress selection, else the committed range.
  let rangeStart = fromDate;
  let rangeEnd = toDate;
  if (pendingStart) {
    const other = hoverDate ?? pendingStart;
    rangeStart = other < pendingStart ? other : pendingStart;
    rangeEnd = other < pendingStart ? pendingStart : other;
  }

  const handleSelectDate = (date: Date) => {
    if (!pendingStart) {
      setPendingStart(date);
      return;
    }
    const [start, end] = date < pendingStart ? [date, pendingStart] : [pendingStart, date];
    onChange(formatDate(start), formatDate(end));
    setCalendarOpen(false);
  };

  const handleMonthChange = (offset: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => {
        hoverRef.current = true;
        setCalendarOpen(true);
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
        setTimeout(() => {
          if (!hoverRef.current) {
            setCalendarOpen(false);
          }
        }, 100);
      }}
    >
      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        className="flex items-center gap-2 bg-[#181b21] text-white px-3 py-1.5 rounded-lg border border-[#2D3139] text-sm hover:border-rose-500 focus:outline-none focus:border-rose-500"
        aria-label="Date range picker"
      >
        <Calendar className="h-4 w-4 text-gray-300" />
        <span>{formatDisplay(fromDate)}</span>
        <span className="text-gray-400">-</span>
        <span>{formatDisplay(toDate)}</span>
      </button>
      {calendarOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-lg border border-[#2D3139] bg-[#181b21] shadow-xl z-30">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D3139]">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              className="p-1 rounded-md text-gray-300 hover:text-white hover:bg-[#2D3139] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium text-white">{monthLabel}</div>
            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              className="p-1 rounded-md text-gray-300 hover:text-white hover:bg-[#2D3139] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 px-3 pt-2 text-xs text-gray-400">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-2" onMouseLeave={() => setHoverDate(null)}>
            {calendarCells.map((cell) => {
              const time = cell.date.getTime();
              const isStart = rangeStart ? time === rangeStart.getTime() : false;
              const isEnd = rangeEnd ? time === rangeEnd.getTime() : false;
              const inRange =
                rangeStart && rangeEnd ? time >= rangeStart.getTime() && time <= rangeEnd.getTime() : false;
              const isToday = time === new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

              const monthStyles = cell.isCurrentMonth ? 'text-white' : 'text-gray-500';
              const edgeStyles =
                isStart || isEnd ? 'bg-rose-500 text-white font-semibold' : 'hover:bg-[#2D3139]';
              const todayStyles = !isStart && !isEnd && isToday ? 'text-rose-300 font-semibold' : '';
              const todayDot = isStart || isEnd ? 'bg-white' : 'bg-rose-400';

              // Continuous band behind the range: edge cells only fill the half facing the range,
              // and the band is rounded where a week row wraps.
              const column = cell.date.getDay();
              const bandLeft = inRange && !isStart;
              const bandRight = inRange && !isEnd;
              const showBand = bandLeft || bandRight;
              const bandStyles = [
                'absolute inset-y-0 bg-rose-500/20',
                bandLeft ? (column === 0 ? 'left-0 rounded-l-full' : 'left-0') : 'left-1/2',
                bandRight ? (column === 6 ? 'right-0 rounded-r-full' : 'right-0') : 'right-1/2'
              ].join(' ');

              return (
                <div key={time} className="relative flex justify-center">
                  {showBand && <div className={bandStyles} />}
                  <button
                    type="button"
                    onClick={() => handleSelectDate(cell.date)}
                    onMouseEnter={() => pendingStart && setHoverDate(cell.date)}
                    className={`relative h-8 w-8 rounded-full text-sm transition-colors ${monthStyles} ${edgeStyles} ${todayStyles}`}
                    aria-label={cell.date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  >
                    {cell.day}
                    {isToday && (
                      <span
                        className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${todayDot}`}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="px-3 pb-2 text-xs text-gray-400">
            {pendingStart ? 'Select end date' : 'Select start date'}
          </div>
        </div>
      )}
    </div>
  );
}
