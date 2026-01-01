import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
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

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

type CalendarCell = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
};

const getCalendarCells = (viewDate: Date): CalendarCell[] => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - startDay + 1;
    let cellYear = year;
    let cellMonth = month;
    let day = dayOffset;
    let isCurrentMonth = true;

    if (dayOffset < 1) {
      isCurrentMonth = false;
      cellMonth = month - 1;
      day = daysInPrevMonth + dayOffset;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear -= 1;
      }
    } else if (dayOffset > daysInMonth) {
      isCurrentMonth = false;
      cellMonth = month + 1;
      day = dayOffset - daysInMonth;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear += 1;
      }
    }

    cells.push({
      date: new Date(cellYear, cellMonth, day),
      day,
      isCurrentMonth
    });
  }

  return cells;
};

export default function DateInput({ label, value, onChange }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateValue(value) ?? new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (calendarOpen) {
      setViewDate(selectedDate ?? new Date());
    }
  }, [calendarOpen, selectedDate]);

  useEffect(() => {
    if (!calendarOpen && selectedDate) {
      setViewDate(selectedDate);
    }
  }, [calendarOpen, selectedDate]);

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

  const handleSelectDate = (date: Date) => {
    onChange(formatDate(date));
    setCalendarOpen(false);
  };

  const handleMonthChange = (offset: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div
      ref={wrapperRef}
      className="flex items-center gap-2"
      onMouseEnter={() => {
        setIsHovered(true);
        hoverRef.current = true;
        setCalendarOpen(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        hoverRef.current = false;
        setTimeout(() => {
          if (!hoverRef.current) {
            setCalendarOpen(false);
          }
        }, 100);
      }}
    >
      <label className="text-sm text-gray-400">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setCalendarOpen(true)}
          onClick={() => setCalendarOpen(true)}
          className="bg-[#181b21] text-white px-3 py-1.5 pr-2 rounded-lg border border-[#2D3139] text-sm focus:outline-none focus:border-rose-500"
        />
        <button
          type="button"
          onClick={() => setCalendarOpen((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
          aria-label={`${label} date picker`}
        >
          <Calendar className="h-4 w-4" />
        </button>
        {calendarOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-[#2D3139] bg-[#181b21] bg-opacity-50 backdrop-blur-md shadow-xl z-30">
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
            <div className="grid grid-cols-7 gap-1 px-3 pt-2 text-xs text-gray-400">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 px-3 pb-3">
              {calendarCells.map((cell) => {
                const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
                const isToday = isSameDay(cell.date, today);
                const baseStyles = 'h-8 w-8 rounded-md text-sm transition-colors';
                const monthStyles = cell.isCurrentMonth ? 'text-white' : 'text-gray-500';
                const selectedStyles = isSelected ? 'bg-rose-500 text-white' : 'hover:bg-[#2D3139]';
                const todayStyles = !isSelected && isToday ? 'border border-rose-400' : 'border border-transparent';

                return (
                  <button
                    key={`${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.day}`}
                    type="button"
                    onClick={() => handleSelectDate(cell.date)}
                    className={`${baseStyles} ${monthStyles} ${selectedStyles} ${todayStyles}`}
                    aria-label={cell.date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
