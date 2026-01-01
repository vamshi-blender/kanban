import { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, StopCircle } from 'lucide-react';
import ReportTypeDropdown from '../components/attendance-report/ReportTypeDropdown';
import DateInput from '../components/attendance-report/DateInput';
import { fetchAttendanceReport, AttendanceRecord } from '../services/api';

const REPORT_TYPES = ['This Week', 'Last Week', 'Today', 'Yesterday', 'Custom Date'];

// LocalStorage keys for persistence
const STORAGE_KEYS = {
  COLUMNS: 'attendance_selected_columns',
  REPORT_TYPE: 'attendance_report_type',
  FROM_DATE: 'attendance_from_date',
  TO_DATE: 'attendance_to_date',
  TABLE_DATA: 'attendance_table_data',
  LAST_FETCH_DATES: 'attendance_last_fetch_dates'
};

// Persistence utilities for columns
const getSavedColumns = (): string[] | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.COLUMNS);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading columns from localStorage:', error);
    return null;
  }
};

const saveColumns = (columns: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLUMNS, JSON.stringify(columns));
  } catch (error) {
    console.error('Error saving columns to localStorage:', error);
  }
};

// Persistence utilities for report type
const getSavedReportType = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REPORT_TYPE);
  } catch (error) {
    console.error('Error loading report type from localStorage:', error);
    return null;
  }
};

const saveReportType = (reportType: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORT_TYPE, reportType);
  } catch (error) {
    console.error('Error saving report type to localStorage:', error);
  }
};

// Persistence utilities for dates
const getSavedDates = (): { from: string; to: string } | null => {
  try {
    const from = localStorage.getItem(STORAGE_KEYS.FROM_DATE);
    const to = localStorage.getItem(STORAGE_KEYS.TO_DATE);
    if (from && to) {
      return { from, to };
    }
    return null;
  } catch (error) {
    console.error('Error loading dates from localStorage:', error);
    return null;
  }
};

const saveDates = (from: string, to: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FROM_DATE, from);
    localStorage.setItem(STORAGE_KEYS.TO_DATE, to);
  } catch (error) {
    console.error('Error saving dates to localStorage:', error);
  }
};

// Persistence utilities for table data
const getSavedTableData = (): AttendanceRecord[] | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TABLE_DATA);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading table data from localStorage:', error);
    return null;
  }
};

const saveTableData = (data: AttendanceRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TABLE_DATA, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving table data to localStorage:', error);
  }
};

// Persistence utilities for last fetch dates (to validate cached data)
const getSavedLastFetchDates = (): { from: string; to: string } | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_FETCH_DATES);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading last fetch dates from localStorage:', error);
    return null;
  }
};

const saveLastFetchDates = (from: string, to: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_FETCH_DATES, JSON.stringify({ from, to }));
  } catch (error) {
    console.error('Error saving last fetch dates to localStorage:', error);
  }
};

// Table columns configuration
const TABLE_COLUMNS = [
  { key: "S No", label: "S No" },
  { key: "Employee Code", label: "Employee Code" },
  { key: "Attendance Id", label: "Attendance Id" },
  { key: "Employee Name", label: "Employee Name" },
  { key: "Department", label: "Department" },
  { key: "Reporting Manager Name", label: "Reporting Manager" },
  { key: "Employee Email Id", label: "Email" },
  { key: "Date", label: "Date" },
  { key: "Day", label: "Day" },
  { key: "In Time", label: "In Time" },
  { key: "Out Time", label: "Out Time" },
  { key: "Total Hours", label: "Total Hours" },
  { key: "Greater than 10AM and Less than 5PM", label: "10am-5pm?" },
  { key: "Less than 7 Hours", label: "<7hr" },
  { key: "Attendance Type", label: "Attendance Type" },
  { key: "Balance Day Period", label: "Balance Day Period" },
  { key: "Application 1 Status", label: "App 1 Status" },
  { key: "Application 2 Status", label: "App 2 Status" },
  { key: "Application 1 Pending With", label: "App 1 Pending With" },
  { key: "Application 2 Pending With", label: "App 2 Pending With" },
  { key: "Punch Status", label: "Punch Status" },
  { key: "Total Log Hours", label: "Total Log Hours" },
  { key: "Log Hours Before 11 AM", label: "Log Before 11AM" },
  { key: "Log Hours After 11 AM", label: "Log After 11AM" },
  { key: "First Log DateTime", label: "First Log" },
  { key: "Last Log DateTime", label: "Last Log" },
  { key: "cutoffdatetime", label: "Cutoff DateTime" },
  { key: "No of Times Logged", label: "Times Logged" },
  { key: "Log Status", label: "Log Status" },
  { key: "Month", label: "Month" },
  { key: "Year", label: "Year" },
  { key: "First Half", label: "First Half" },
  { key: "Second Half", label: "Second Half" }
];

// Default visible columns
const DEFAULT_VISIBLE_COLUMNS = [
  "Date",
  "Day",
  "In Time",
  "Out Time",
  "Total Hours",
  "Greater than 10AM and Less than 5PM",
  "Less than 7 Hours",
  "Attendance Type",
  "Punch Status",
  "Log Status",
  "Total Log Hours"
];

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get date range based on selection
const getDateRange = (selection: string): { from: string; to: string } => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  switch (selection) {
    case 'This Week': {
      // Week starts on Monday
      const monday = new Date(today);
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      monday.setDate(today.getDate() + diff);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return { from: formatDate(monday), to: formatDate(sunday) };
    }
    case 'Last Week': {
      const monday = new Date(today);
      const diff = dayOfWeek === 0 ? -13 : 1 - dayOfWeek - 7;
      monday.setDate(today.getDate() + diff);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return { from: formatDate(monday), to: formatDate(sunday) };
    }
    case 'Today': {
      const todayStr = formatDate(today);
      return { from: todayStr, to: todayStr };
    }
    case 'Yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);
      return { from: yesterdayStr, to: yesterdayStr };
    }
    default:
      return { from: '', to: '' };
  }
};

function Attendance() {
  // Initialize state from localStorage or defaults
  const [selectedReportType, setSelectedReportType] = useState(() => {
    const saved = getSavedReportType();
    return saved && REPORT_TYPES.includes(saved) ? saved : REPORT_TYPES[0];
  });

  const [fromDate, setFromDate] = useState(() => {
    const savedDates = getSavedDates();
    if (savedDates) return savedDates.from;
    return getDateRange('This Week').from;
  });

  const [toDate, setToDate] = useState(() => {
    const savedDates = getSavedDates();
    if (savedDates) return savedDates.to;
    return getDateRange('This Week').to;
  });

  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    const saved = getSavedColumns();
    return saved && saved.length > 0 ? saved : DEFAULT_VISIBLE_COLUMNS;
  });

  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const [isColumnHovered, setIsColumnHovered] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);

  // API data state - initialize from cache if dates match
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(() => {
    const savedData = getSavedTableData();
    const lastFetchDates = getSavedLastFetchDates();
    const savedDates = getSavedDates();

    // Only use cached data if the dates match
    if (savedData && lastFetchDates && savedDates &&
        lastFetchDates.from === savedDates.from &&
        lastFetchDates.to === savedDates.to) {
      return savedData;
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [hasLeftButtonAfterClick, setHasLeftButtonAfterClick] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Save columns to localStorage when they change
  useEffect(() => {
    saveColumns(selectedColumns);
  }, [selectedColumns]);

  // Save report type to localStorage when it changes
  useEffect(() => {
    saveReportType(selectedReportType);
  }, [selectedReportType]);

  // Save dates to localStorage when they change
  useEffect(() => {
    if (fromDate && toDate) {
      saveDates(fromDate, toDate);
    }
  }, [fromDate, toDate]);

  // Update dates when report type changes (except for Custom Date)
  useEffect(() => {
    if (selectedReportType !== 'Custom Date') {
      const { from, to } = getDateRange(selectedReportType);
      setFromDate(from);
      setToDate(to);
    }
  }, [selectedReportType]);

  // Click outside handler for column dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnRef.current && !columnRef.current.contains(event.target as Node)) {
        setColumnDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (selectedReportType !== 'Custom Date') {
      setSelectedReportType('Custom Date');
    }
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    if (selectedReportType !== 'Custom Date') {
      setSelectedReportType('Custom Date');
    }
  };

  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both from and to dates');
      return;
    }

    // If already loading, stop the current request
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
      stopElapsedTimer();
      setIsLoading(false);
      setElapsedTime(0);
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setElapsedTime(0);
    setHasLeftButtonAfterClick(false);
    startElapsedTimer();

    try {
      const data = await fetchAttendanceReport(fromDate, toDate, abortControllerRef.current.signal);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setAttendanceData(data);

      // Save to localStorage for persistence
      saveTableData(data);
      saveLastFetchDates(fromDate, toDate);
    } catch (err) {
      // Don't show error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
      console.error('Error fetching attendance:', err);
    } finally {
      stopElapsedTimer();
      setIsLoading(false);
      setElapsedTime(0);
      abortControllerRef.current = null;
    }
  };

  const startElapsedTimer = () => {
    startTimeRef.current = Date.now();
    elapsedTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);
    }, 100); // Update every 100ms for smooth display
  };

  const stopElapsedTimer = () => {
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopElapsedTimer();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleColumnSelectAll = () => {
    if (selectedColumns.length === TABLE_COLUMNS.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(TABLE_COLUMNS.map(col => col.key));
    }
  };

  const handleColumnRecommended = () => {
    setSelectedColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  const handleColumnToggle = (columnKey: string) => {
    if (selectedColumns.includes(columnKey)) {
      setSelectedColumns(selectedColumns.filter(key => key !== columnKey));
    } else {
      setSelectedColumns([...selectedColumns, columnKey]);
    }
  };

  // Get visible columns based on selection
  const visibleColumns = TABLE_COLUMNS.filter(col => selectedColumns.includes(col.key));

  return (
    <div className="h-screen bg-[#000] text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="py-4 px-6 border-b border-[#181b21]">
        <h1 className="text-xl font-semibold">Attendance & Worklog Report</h1>
      </div>

      {/* Filter Section */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-end gap-4">
          {/* Column Selection Dropdown */}
          <div
            ref={columnRef}
            className="relative"
            onMouseEnter={() => setIsColumnHovered(true)}
            onMouseLeave={() => {
              setIsColumnHovered(false);
              if (!columnDropdownOpen) {
                setTimeout(() => {
                  if (!isColumnHovered) {
                    setColumnDropdownOpen(false);
                  }
                }, 100);
              }
            }}
          >
            <button
              onClick={() => setColumnDropdownOpen(!columnDropdownOpen)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 bg-[#181b21] text-white hover:bg-[#1C1F26]"
            >
              Columns ({selectedColumns.length})
            </button>

            {/* Column Dropdown */}
            <div
              className={`absolute top-full right-0 mt-2 w-64 rounded-lg shadow-lg z-20 bg-[#181b21] bg-opacity-70 backdrop-blur-md
              transition-all duration-300 ease-in-out ${(columnDropdownOpen || isColumnHovered) ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}`}
              style={{ transitionProperty: 'opacity, max-height' }}
            >
              <div className="p-2">
                {/* Recommended Option */}
                <div
                  onClick={handleColumnRecommended}
                  className="flex items-center p-2 hover:bg-[#2D3139] rounded cursor-pointer border-b border-[#2D3139]"
                >
                  <span className="text-sm text-white font-medium">Recommended</span>
                </div>

                {/* Select All Option */}
                <label className="flex items-center p-2 hover:bg-[#2D3139] rounded cursor-pointer border-b border-[#2D3139]">
                  <input
                    type="checkbox"
                    checked={selectedColumns.length === TABLE_COLUMNS.length}
                    onChange={handleColumnSelectAll}
                    className="mr-2"
                  />
                  <span className="text-sm text-white font-medium">Select All</span>
                </label>
              </div>
              <div className="p-2 max-h-60 overflow-y-auto column-scroll">
                {TABLE_COLUMNS.map(column => (
                  <label key={column.key} className="flex items-center p-2 hover:bg-[#2D3139] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => handleColumnToggle(column.key)}
                      className="mr-2"
                    />
                    <span className="text-sm text-white">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <ReportTypeDropdown
            options={REPORT_TYPES}
            value={selectedReportType}
            onChange={setSelectedReportType}
            hiddenOptions={['Custom Date']}
          />

          <DateInput
            label="From"
            value={fromDate}
            onChange={handleFromDateChange}
          />

          <DateInput
            label="To"
            value={toDate}
            onChange={handleToDateChange}
          />

          {/* Search Button */}
          <button
            onClick={handleSearch}
            onMouseEnter={() => setIsSearchHovered(true)}
            onMouseLeave={() => {
              setIsSearchHovered(false);
              if (isLoading) setHasLeftButtonAfterClick(true);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 bg-rose-500 text-white hover:bg-rose-600 flex items-center justify-center gap-2 ${isLoading ? 'min-w-[160px]' : ''}`}
          >
            {isLoading ? (
              <>
                {isSearchHovered && hasLeftButtonAfterClick ? (
                  <>
                    <StopCircle className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="tabular-nums">Loading ({elapsedTime.toFixed(1)}s)</span>
                  </>
                )}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="h-full bg-[#181b21] rounded-lg border border-[#2D3139] overflow-auto column-scroll">
          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-rose-500 mb-2">{error}</p>
                <button
                  onClick={handleSearch}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-rose-500 text-white hover:bg-rose-600"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!error && attendanceData.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <p className="mb-2">No attendance data</p>
                <p className="text-sm">Select a date range and click Search to load data</p>
              </div>
            </div>
          )}

          {/* Data Table */}
          {!error && attendanceData.length > 0 && (
            <table className="w-max min-w-full">
              <thead className="sticky top-0 bg-[#181b21] z-10">
                <tr className="border-b border-[#2D3139]">
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className="text-left px-4 py-3 text-sm font-medium text-gray-400 whitespace-nowrap"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((row, index) => (
                  <tr key={index} className="border-b border-[#2D3139] hover:bg-[#1C1F26]">
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm text-white whitespace-nowrap"
                      >
                        {row[column.key as keyof AttendanceRecord] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;
