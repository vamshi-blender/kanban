import { build } from 'esbuild';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const bundle = await build({ entryPoints: ['src/services/attendanceReport.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { fetchFastAttendanceReport, needsDetailedAttendance } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const attendance = (date = '2026-11-09') => ({ Date: date, 'Employee Code': 'E1', 'Employee Name': 'Test Person',
  'Employee Email Id': 'person@example.com', 'In Time': '09:00 AM', 'Out Time': '06:00 PM', 'Total Hours': '09:00' });
const worklog = (date = '2026-11-08T18:30:00', hours = '1.5') => ({ 'Worklog Date': date, 'Worklog Hours': hours,
  'Email Id': 'person@example.com', Name: 'Test Person' });
const report = (rows, count = rows.length) => Response.json({ Status: false, results: JSON.stringify(rows), __count: count });

function mockReports(attendanceRows, worklogRows) {
  const calls = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ body, signal: options.signal });
    const rows = body.filters[0].LabelName === 'Date' ? attendanceRows : worklogRows;
    return report(rows.slice(body.skip, body.skip + body.top), rows.length);
  };
  return calls;
}

test('starts both reports before either responds, then joins by India date', async () => {
  const pending = [];
  globalThis.fetch = (_url, options) => new Promise(resolve => pending.push({ body: JSON.parse(options.body), resolve }));
  const result = fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token');
  assert.equal(pending.length, 2, 'Both requests must start concurrently');
  assert.equal(pending[0].body.filters[0].DefaultValue, '2026-11-09');
  assert.equal(pending[1].body.orderByFields, '');
  assert.equal(pending[1].body.filters[0].DefaultValue, '2026-11-08T18:30:00.00');
  assert.equal(pending[1].body.filters[0].SecondValue, '2026-11-15T18:29:59.999');
  pending[0].resolve(report([attendance()]));
  pending[1].resolve(report([worklog(), worklog(undefined, '0.5')]));
  const rows = await result;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].Date, '09-Nov-2026');
  assert.equal(rows[0].Day, 'Monday');
  assert.equal(rows[0]['Total Log Hours'], 2);
  assert.equal(rows[0]['No of Times Logged'], 2);
  assert.equal(rows[0]['Log Status'], 'Logged');
  assert.equal(rows[0]['Attendance Type'], undefined);
  assert.equal(rows[0]['Punch Status'], undefined);
});

test('marks worklog-only rows absent without adding missing dates or losing logged hours', async () => {
  mockReports([attendance()], [worklog('2026-11-09T18:30:00', '2')]);
  const rows = await fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].Date, '10-Nov-2026');
  assert.equal(rows[0]['Attendance Type'], 'Absent');
  assert.equal(rows[0]['In Time'], undefined);
  assert.equal(rows[0]['Total Hours'], undefined);
  assert.equal(rows[0]['Total Log Hours'], 2);
  assert.equal(rows[1]['Log Status'], 'Not Logged');
  assert.equal(rows[1]['Total Log Hours'], 0);
  assert.equal(rows[1]['Attendance Type'], undefined);
});

test('paginates before summing decimal hours', async () => {
  const calls = mockReports([attendance()], Array.from({ length: 501 }, () => worklog(undefined, '0.01')));
  const rows = await fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token');
  assert.equal(calls.length, 3);
  assert.equal(rows[0]['Total Log Hours'], 5.01);
  assert.equal(rows[0]['No of Times Logged'], 501);
});

test('trims adjacent-day report spill but includes the end of the final India date', async () => {
  mockReports([], [worklog('2026-11-08T10:00:00', '5'), worklog('2026-11-15T18:29:59.999', '2'), worklog('2026-11-15T18:30:00', '4')]);
  const rows = await fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].Date, '15-Nov-2026');
  assert.equal(rows[0]['Total Log Hours'], 2);
});

test('rejects incomplete report pages instead of reporting incorrect totals', async () => {
  globalThis.fetch = async () => report([attendance()], 501);
  await assert.rejects(fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token'), /incomplete/);
});

test('rejects inconsistent employees and invalid worklog hours', async () => {
  mockReports([attendance()], [{ ...worklog(), 'Email Id': 'other@example.com' }]);
  await assert.rejects(fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token'), /different employees/);
  mockReports([attendance()], [worklog(undefined, '-1')]);
  await assert.rejects(fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token'), /invalid worklog hours/);
});

test('invalid dates stop before any request', async () => {
  const calls = mockReports([], []);
  for (const [from, to] of [['2026-11-15', '2026-11-09'], ['2026-02-30', '2026-03-01'], ['2024-01-01', '2026-11-11']]) {
    await assert.rejects(fetchFastAttendanceReport(from, to, 'test-token'));
  }
  assert.equal(calls.length, 0);
});

test('cancels both feeds and aborts the other feed if one fails', async () => {
  const signals = [];
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => {
    signals.push(options.signal);
    options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
  });
  const controller = new AbortController();
  const result = fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token', controller.signal);
  controller.abort();
  await assert.rejects(result, { name: 'AbortError' });
  assert.ok(signals.every(signal => signal.aborted));
  let siblingSignal;
  globalThis.fetch = (_url, options) => {
    if (JSON.parse(options.body).filters[0].LabelName === 'Date') return Promise.resolve(new Response('', { status: 503 }));
    siblingSignal = options.signal;
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  };
  await assert.rejects(fetchFastAttendanceReport('2026-11-09', '2026-11-15', 'test-token'), /503/);
  assert.equal(siblingSignal.aborted, true);
});

test('keeps advanced columns on the detailed report', () => {
  assert.equal(needsDetailedAttendance(['Date', 'Day', 'Total Hours', 'Total Log Hours', 'Log Status']), false);
  for (const column of ['Attendance Type', 'Punch Status', 'Application 1 Status', 'Log Hours Before 11 AM', 'cutoffdatetime']) {
    assert.equal(needsDetailedAttendance(['Date', column]), true);
  }
});
