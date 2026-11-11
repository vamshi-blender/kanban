import type { AttendanceRecord } from './api';

const REPORT_URL = 'https://homeapi.quixy.com/api/Report/GetGridReportData';
const ATTENDANCE_REPORT = '27052024-171954081-2775b943-8c3b-44f6-8a03-c0acbc565edb';
const WORKLOG_REPORT = '05072022-184853620-cf972961-d811-4ae5-9704-faddf3cb9b42';
const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 19_800_000;

// Other columns come from the detailed history report. Do not infer approval,
// absence, WFH, or punch status from attendance times.
export const FAST_ATTENDANCE_COLUMNS = new Set([
  'S No', 'Employee Code', 'Employee Name', 'Department', 'Reporting Manager Name',
  'Employee Email Id', 'Date', 'Day', 'In Time', 'Out Time', 'Total Hours',
  'Greater than 10AM and Less than 5PM', 'Less than 7 Hours', 'Total Log Hours',
  'Log Status', 'No of Times Logged', 'Month', 'Year',
]);

export function needsDetailedAttendance(columns: readonly string[]): boolean {
  return columns.some(column => !FAST_ATTENDANCE_COLUMNS.has(column));
}

type ReportRow = Record<string, unknown>;

function parseDate(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Select dates in YYYY-MM-DD format.');
  const value = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== date) throw new Error('Select a valid calendar date.');
  return value;
}

async function fetchReport(reportId: string, label: string, from: string, to: string, token: string, signal: AbortSignal): Promise<ReportRow[]> {
  const rows: ReportRow[] = [];
  const pageSize = 500;
  let expectedCount: number | undefined;
  for (let skip = 0; skip < 10000; skip += pageSize) {
    signal.throwIfAborted();
    const response = await fetch(REPORT_URL, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, signal,
      body: JSON.stringify({
        reportId, skip, top: pageSize, orderByFields: label === 'Date' ? 'Date desc' : '',
        filters: [{ ElementType: 'Date', LabelName: label, Condition: 'Custom', Type: 'textType',
          DefaultValue: from, SecondValue: to, MappingType: 'Mapped' }],
        groupAggregate: null, isShowGrid: false, isChartBasedReportGridCall: false,
      }),
    });
    if (!response.ok) throw new Error(`Could not load ${label === 'Date' ? 'attendance' : 'worklogs'} (${response.status}).`);
    const data: { results?: unknown; __count?: unknown; errorMessage?: unknown; ErrorMessage?: unknown } = await response.json();
    // Both reports use Status=false for valid data; validate errors and rows.
    if (data.errorMessage || data.ErrorMessage || typeof data.results !== 'string') throw new Error('PMS could not retrieve the report.');
    let page: unknown;
    try { page = JSON.parse(data.results); } catch { throw new Error('PMS returned invalid report data.'); }
    if (!Array.isArray(page) || page.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('PMS returned invalid report rows.');
    if (data.__count !== undefined) {
      if (typeof data.__count !== 'number' || !Number.isInteger(data.__count) || data.__count < 0 ||
          (expectedCount !== undefined && expectedCount !== data.__count)) throw new Error('The report changed during loading. Search again.');
      expectedCount = data.__count;
    }
    rows.push(...page);
    if (expectedCount !== undefined && rows.length > expectedCount) throw new Error('PMS returned inconsistent report rows.');
    if (rows.length === expectedCount || (expectedCount === undefined && page.length < pageSize)) return rows;
    if (page.length !== pageSize) throw new Error('PMS returned incomplete data. Search again.');
  }
  throw new Error('Too many entries. Select a shorter date range.');
}

function worklogDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) throw new Error('PMS returned an invalid worklog date.');
  const milliseconds = Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`);
  if (!Number.isFinite(milliseconds)) throw new Error('PMS returned an invalid worklog date.');
  return new Date(milliseconds + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function text(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}

/** Fetch both user-scoped feeds concurrently, then join by India calendar day.
 * Worklog-only dates are marked Absent; dates with no records are not added. */
export async function fetchFastAttendanceReport(fromDate: string, toDate: string, token: string, signal?: AbortSignal): Promise<AttendanceRecord[]> {
  const start = parseDate(fromDate), end = parseDate(toDate);
  if (start > end) throw new Error('The start date must be on or before the end date.');
  if ((end - start) / DAY_MS >= 366) throw new Error('Select a date range of at most 366 days.');
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const [attendance, worklogs] = await Promise.all([
      fetchReport(ATTENDANCE_REPORT, 'Date', fromDate, toDate, token, controller.signal),
      fetchReport(WORKLOG_REPORT, 'Worklog Date', new Date(start - IST_OFFSET_MS).toISOString().replace('.000Z', '.00'),
        new Date(end + DAY_MS - IST_OFFSET_MS - 1).toISOString().slice(0, -1), token, controller.signal),
    ]);
    controller.signal.throwIfAborted();
    const byDate = new Map<string, AttendanceRecord>();
    const emails = new Set<string>();
    for (const row of [...attendance, ...worklogs]) {
      const email = row['Employee Email Id'] ?? row['Email Id'];
      if (typeof email === 'string' && email.trim()) emails.add(email.trim().toLowerCase());
    }
    if (emails.size > 1) throw new Error('PMS returned records for different employees. No records were combined.');
    for (const row of attendance) {
      const date = text(row.Date);
      if (!date || date < fromDate || date > toDate || byDate.has(date)) throw new Error('PMS returned unexpected attendance dates.');
      parseDate(date);
      byDate.set(date, {
        Date: date, 'Employee Code': text(row['Employee Code']), 'Employee Name': text(row['Employee Name']),
        Department: text(row.Department), 'Employee Email Id': text(row['Employee Email Id']),
        'Reporting Manager Name': text(row['Reporting Manager Name'] ?? row['Reporting Manager']),
        'In Time': text(row['In Time']), 'Out Time': text(row['Out Time']), 'Total Hours': text(row['Total Hours']),
        'Greater than 10AM and Less than 5PM': text(row['Greater than 10AM and Less than 5PM']),
        'Less than 7 Hours': text(row['Less than 7 Hours']), 'Total Log Hours': 0, 'No of Times Logged': 0, 'Log Status': 'Not Logged',
      });
    }
    for (const log of worklogs) {
      const date = worklogDate(log['Worklog Date']);
      // PMS filters UTC date parts and may include adjacent India dates.
      const milliseconds = parseDate(date);
      if (milliseconds < start - DAY_MS || milliseconds > end + DAY_MS) throw new Error('PMS returned worklogs outside the requested range.');
      const rawHours = log['Worklog Hours'];
      if ((typeof rawHours !== 'number' && (typeof rawHours !== 'string' || !/^\d+(\.\d+)?$/.test(rawHours))) ||
          !Number.isFinite(Number(rawHours)) || Number(rawHours) < 0) throw new Error('PMS returned invalid worklog hours.');
      if (date < fromDate || date > toDate) continue;
      const row = byDate.get(date) ?? { Date: date, 'Employee Name': text(log.Name), Department: text(log.Department),
        'Employee Email Id': text(log['Email Id']), 'Attendance Type': 'Absent', 'Total Log Hours': 0, 'No of Times Logged': 0 };
      row['Total Log Hours'] = Number(row['Total Log Hours'] ?? 0) + Number(rawHours);
      if (!Number.isFinite(row['Total Log Hours'])) throw new Error('PMS returned invalid total worklog hours.');
      row['No of Times Logged'] = Number(row['No of Times Logged'] ?? 0) + 1;
      row['Log Status'] = 'Logged';
      byDate.set(date, row);
    }
    return [...byDate].sort(([a], [b]) => b.localeCompare(a)).map(([date, row], index) => {
      const value = new Date(`${date}T00:00:00Z`);
      return { ...row, Date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(value).replace(/ /g, '-'),
        Day: new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(value),
        Month: new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(value), Year: String(value.getUTCFullYear()),
        'S No': index + 1, 'Total Log Hours': Math.round(Number(row['Total Log Hours'] ?? 0) * 1e8) / 1e8 };
    });
  } catch (error) {
    controller.abort();
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
  }
}
