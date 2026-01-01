import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ReportTypeDropdown from '../components/attendance-report/ReportTypeDropdown';
import DateInput from '../components/attendance-report/DateInput';

const REPORT_TYPES = ['This Week', 'Last Week', 'Today', 'Yesterday', 'Custom Date'];

// Sample data
const SAMPLE_DATA = [
  {
    "S No": 236300,
    "Employee Code": "E1469",
    "Attendance Id": "VM/LAP/26027",
    "Employee Name": "Vamshi Sai Krishna Arelli",
    "Department": "Product",
    "Reporting Manager Name": "Shivam Nema",
    "Employee Email Id": "vamshisaikrishna.arelli@quixy.com",
    "Date": "26-Nov-2025",
    "Day": "Wednesday",
    "In Time": "09:08 AM",
    "Out Time": "-",
    "Total Hours": "-",
    "Greater than 10AM and Less than 5PM": "<5PM",
    "Less than 7 Hours": "Yes",
    "Attendance Type": "PL",
    "Balance Day Period": "NA",
    "Application 1 Status": "Approved",
    "Application 2 Status": "NA",
    "Application 1 Pending With": "NA",
    "Application 2 Pending With": "NA",
    "Punch Status": "One Time Punch[OTP]",
    "Total Log Hours": 0,
    "Log Hours Before 11 AM": 0,
    "Log Hours After 11 AM": 0,
    "First Log DateTime": "",
    "Last Log DateTime": "",
    "cutoffdatetime": "",
    "No of Times Logged": 0,
    "Log Status": "Not Logged",
    "Month": "November",
    "Year": "2025",
    "First Half": "NA",
    "Second Half": "NA"
  }
];

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
  { key: "Greater than 10AM and Less than 5PM", label: ">10AM & <5PM" },
  { key: "Less than 7 Hours", label: "<7 Hours" },
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
  const [selectedReportType, setSelectedReportType] = useState(REPORT_TYPES[0]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Initialize dates on mount and when selection changes
  useEffect(() => {
    if (selectedReportType !== 'Custom Date') {
      const { from, to } = getDateRange(selectedReportType);
      setFromDate(from);
      setToDate(to);
    }
  }, [selectedReportType]);

  // Initialize with "This Week" dates on mount
  useEffect(() => {
    const { from, to } = getDateRange('This Week');
    setFromDate(from);
    setToDate(to);
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

  const handleSearch = () => {
    // Placeholder for search functionality
    console.log('Search clicked', { selectedReportType, fromDate, toDate });
  };

  return (
    <div className="h-screen bg-[#000] text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="py-4 px-6 border-b border-[#181b21]">
        <h1 className="text-xl font-semibold">Attendance & Worklog Report</h1>
      </div>

      {/* Filter Section */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-end gap-4">
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
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 bg-rose-500 text-white hover:bg-rose-600 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="h-full bg-[#181b21] rounded-lg border border-[#2D3139] overflow-auto column-scroll">
          <table className="w-max min-w-full">
            <thead className="sticky top-0 bg-[#181b21] z-10">
              <tr className="border-b border-[#2D3139]">
                {TABLE_COLUMNS.map((column) => (
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
              {SAMPLE_DATA.map((row, index) => (
                <tr key={index} className="border-b border-[#2D3139] hover:bg-[#1C1F26]">
                  {TABLE_COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-white whitespace-nowrap"
                    >
                      {row[column.key as keyof typeof row] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
