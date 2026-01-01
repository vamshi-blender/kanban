import { Task } from '../types';
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../config/authConfig";
import { getApiKey } from '../utils/apiKeyManager';

const API_URL = 'https://homeapi.quixy.com/api/Report/GetViewResult';

// Fallback API token for development/testing purposes
// In production, users should provide their own API key
const FALLBACK_API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkUzMDIwQkIwMTRGQzc0QjZBNEI3QjU5QTFBMTgzOENDIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3NTE4NzYxOTAsImV4cCI6MTc1NDQ2ODE5MCwiaXNzIjoiaWRzcnYucXVpeHkuY29tIiwiY2xpZW50X2lkIjoiYW5ndWxhcl9zcGEiLCJzdWIiOiJ2YW1zaGlzYWlrcmlzaG5hLmFyZWxsaUBxdWl4eS5jb20iLCJhdXRoX3RpbWUiOjE3NTE4NzYxOTAsImlkcCI6IiIsIlVzZXJOYW1lIjoidmFtc2hpc2Fpa3Jpc2huYS5hcmVsbGlAcXVpeHkuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6InZhbXNoaSBzYWkga3Jpc2huYWFyZWxsaTY5MzIiLCJVc2VySWQiOiIxNzA2MjAyNC0xODE0MTMxNDYtMjQxMTIxZTQtNjY0NC00ODFmLWEwZWEtZGRmOWUzODMyNTc1IiwiTmFtZSI6IlZhbXNoaSBTYWkgS3Jpc2huYSBBcmVsbGkiLCJFbWFpbElkIjoidmFtc2hpc2Fpa3Jpc2huYS5hcmVsbGlAcXVpeHkuY29tIiwiVXNlclR5cGUiOiJVc2VyIiwicm9sZSI6IlVzZXIiLCJPcmdhbml6YXRpb25JZCI6IjI5MTAyMDE5LTA5MzQzNDU0OC1hNGZlNDFiMC0xZmQwLTQ4OWEtYWMwOC1hMjliOTg4ODMxNDMiLCJBY2NlcHRlZFRlcm1zIjoiVHJ1ZSIsIklwQ29uZmlndXJhdGlvbkVuYWJsZWQiOiJGYWxzZSIsImlzU2Fhc0luc3RhbmNlIjoiVHJ1ZSIsImFwaVVybCI6IiIsImFwaUtleSI6IiIsIlNhbmRib3hUeXBlIjoiQWR2YW5jZWQiLCJTdGFnZUFjY2VzcyI6IkxpdmUiLCJBbGxvd2VkSXBzIjoiIiwiRGF0YWJhc2VOYW1lIjoiMjkxMDIwMTktMDkzNDM0NTQ4LWE0ZmU0MWIwLTFmZDAtNDg5YS1hYzA4LWEyOWI5ODg4MzE0MyIsIkRhdGVGb3JtYXQiOiJkZC9NTS95eXl5IiwiU3Vic2NyaXB0aW9uVHlwZSI6IlVzZXIiLCJUaW1lRm9ybWF0IjoiaGg6bW0gYSIsIkRvbWFpbiI6Imh0dHBzOi8vdml2aWRtaW5kcy5xdWl4eS5jb20iLCJBY2NlcHRlZFRlcm1zRGF0ZSI6IjYvMTgvMjAyNCA4OjM4OjI4IEFNIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsIlRpbWVab25lIjoiSW5kaWEgU3RhbmRhcmQgVGltZSIsImp0aSI6IjI2MjlEMzhDNTU3NjFCMDBDNTVEOUUxNDFCNkYyMDFEIiwic2lkIjoiRTlFQTZEQTFGRjhDNEEwQzlGMkJFQjU5RTc3OUYwOTUiLCJpYXQiOjE3NTE4NzYxOTAsInNjb3BlIjpbIm9wZW5pZCIsInByb2ZpbGUiLCJyb2xlcyIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJleHRlcm5hbCJdfQ.g9a34AJ0A_lPjxCuADm2s1DXp1zv9q-9Iuo8To5LBqFt_PoMuUlqWI30AtYyIFZIApkXkLO8CQ9XXaErS4sJLb1dE0X8UMrFnnBs29XrnuQZpDhPnU4SMte9yojZjv02QZiRaVnzDyyI8FrGC_MAal_LDEieDO1GkLXUKQljKRcrS69FBQMgjXSRVbKoKiVJuHJWIgfcLcR2IIzYuetb0EugKnUgqLt4iJ-9vn62Ud5hl_-otEASVYSTk4Wj-QZ9VkMQqHlyLxZKI7eDIDNEM45Mr4tYciYjiekwLE0O-n7uckUPNviQ1bQ5AOZfg-KvWcT9whYQCuynQMV-GJN5SQ';

/**
 * Gets the API token to use for requests
 * Prioritizes user-provided API key, falls back to default token
 * @returns The API token to use for authorization
 */
const getApiToken = (): string => {
  const userApiKey = getApiKey();
  if (userApiKey) {
    console.log('Using user-provided API key');
    return userApiKey;
  }

  console.log('Using fallback API token');
  return FALLBACK_API_TOKEN;
};

// Module-level variable to store the current Project ID
let currentProjectId: string | null = null;

// Create MSAL instance for authentication checks
const msalInstance = new PublicClientApplication(msalConfig);

interface ApiResponse {
  Status: boolean;
  results: string;
  __count: number;
}

interface ApiTask {
  'Issue Id': string;
  'Summary': string;
  'Assignee': string;
  'Issue Type': string;
  'Status': string;
  'Project Id': string;
  'Record Id': string;
  'Reporter': string;
  'Estimated Hours': string;
  'Detection Phase': string;
  'Status Indicator': string;
  'Sprint Name': string;
  'Team Member Email Id': string;
}

interface StatusCheckResponse {
  Status: boolean;
  results: string;
  __count: number;
}

export async function fetchTasks(sprintName: string = 'DAP - 26'): Promise<Task[]> {
  const pageSize = 100;
  let skip = 0;
  let allApiTasks: ApiTask[] = [];
  let totalCount = 0;
  let hasMore = true;

  const payload = {
    orderByFields: '',
    filters: {
      searchString: '',
      columns: 'Actions,Sub Tasks,Issue Id,Sprint Name,Issue Type,Summary,Status,Assignee,Project Id,Record Id,Reporter,Estimated Hours,Detection Phase,Status Indicator,Team Member Email Id',
      groupedColumns: '',
      rowHeight: null,
      columnsOrder: 'Actions,Sub Tasks,Issue Id,Sprint Name,Issue Type,Summary,Status,Issue Category,Sprint Rank,Reporter,Assignee,Created Date Time,Due Date,Updated On,Dependent Id,Priority,Estimated Hours,Logged Hours,Remaining Hours,Release,Browser,Bug Type,Detection Phase,Fix Branch,Injection Phase,Severity,Required Builds,Checkin Given Branch,Configurations Made,DB scripts,DB scripts exist,Impacted Features Of The Bug,Test Case Id,Project Name,Module,Sub Module,Resource Type,Release DateTime,Created DateTime,Bug Age,Client Name,Reporter Story Points,Assignee Story Points,Task Type,Feature,Sub Feature,Group Name,Bug Scenario,Coding Target Date,Test Cases Target Date,Unit Testing Target Date,Devbox Testing Target Date,System Testing Target Date,Impact Features Sharepoint Link,Issue Reproduced Or Not,Steps To Reproduce,Reason For Not Reproducing,POD,IssueType,Bug Fixed Date,POD Test Owner,POD Dev Owner,BA Owner,DB Type',
      resizedColumns: [],
      pageSize: pageSize,
      filters: [],
      sorting: [],
      CustomUserViewFilters: [
        {
          Order: 0,
          ColumnName: 'Sprint Name',
          ElementType: 'TextBox',
          ConditionType: 'Equal',
          Value: sprintName,
          IsEditable: true,
          IsVisible: false,
          SecondValue: '',
          SelectedValues: [sprintName]
        },
        {
          ColumnName: "Issue Type",
          ElementType: "TextBox",
          ConditionType: "Is Not Any",
          Order: 1,
          // Value: "Bug,Task",
          SecondValue: "",
          IsVisible: false,
          IsEditable: true,
          SelectedValues: [
              "Bug",
              "Task"
          ],
          IsDynamicFilter: true,
          IsMappedColumn: false,
          SelectedValue: ""
        }
      ]
    }
  };

  try {
    console.log(`Starting to fetch tasks for sprint: ${sprintName}`);

    // Fetch all pages using pagination
    while (hasMore) {
      console.log(`Fetching page: skip=${skip}, take=${pageSize}`);

      const response = await fetch(`${API_URL}?skip=${skip}&take=${pageSize}&viewId=05072022-184836479-5888ab5b-d645-4e86-a937-f2d02d2414c1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getApiToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.Status) {
        throw new Error('API returned unsuccessful status');
      }

      // Store total count from first response
      if (skip === 0) {
        totalCount = data.__count;
        console.log(`Total records available: ${totalCount}`);
      }

      // Parse the results string into an array of tasks
      const apiTasks: ApiTask[] = JSON.parse(data.results);
      console.log(`Fetched ${apiTasks.length} tasks in this batch`);

      // Add to our collection
      allApiTasks = [...allApiTasks, ...apiTasks];

      // Check if we have more pages to fetch
      skip += pageSize;
      hasMore = allApiTasks.length < totalCount && apiTasks.length === pageSize;
    }

    console.log(`Finished fetching all tasks. Total tasks: ${allApiTasks.length}`);

    // Extract Project ID from the first task (all tasks should have the same Project ID)
    if (allApiTasks.length > 0) {
      const projectId = allApiTasks[0]['Project Id'];
      if (projectId && typeof projectId === 'string') {
        currentProjectId = projectId;
        console.log('Extracted Project ID from fetchTasks:', currentProjectId);
      } else {
        console.warn('No Project Id found in API response, keeping current Project ID:', currentProjectId);
      }
    } else {
      console.warn('No tasks found in API response, keeping current Project ID:', currentProjectId);
    }

    // Convert API tasks to our Task format
    return allApiTasks.map((apiTask, index) => ({
      id: index + 1,
      columnId: apiTask.Status,
      content: `Issue Id: ${apiTask['Issue Id']}\nSummary: ${apiTask.Summary}\nAssignee: ${apiTask.Assignee}\nIssue Type: ${apiTask['Issue Type']}`,
      rowData: {
        'Issue Id': apiTask['Issue Id'],
        'Summary': apiTask.Summary,
        'Assignee': apiTask.Assignee,
        'Issue Type': apiTask['Issue Type'],
        'Status': apiTask.Status,
        'Record Id': apiTask['Record Id'],
        'Project Id': apiTask['Project Id'],
        'Reporter': apiTask['Reporter'],
        'Estimated Hours': apiTask['Estimated Hours'],
        'Detection Phase': apiTask['Detection Phase'],
        'Status Indicator': apiTask['Status Indicator'],
        'Sprint Name': apiTask['Sprint Name'],
        'Team Member Email Id': apiTask['Team Member Email Id']
      }
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

// Helper function to get the current Project ID
export function getCurrentProjectId(): string | null {
  return currentProjectId;
}


interface UpdateTaskStatusResponse {
  Status: boolean;
  results?: string;
  message?: string;
}

// Helper function to check if user is logged in via Microsoft authentication
const isUserLoggedIn = (): boolean => {
  try {
    // Check if MSAL instance has any active accounts
    const accounts = msalInstance.getAllAccounts();

    if (accounts.length === 0) {
      console.log('No MSAL accounts found - user not logged in');
      return false;
    }

    // Check if there's a valid account with required properties
    const activeAccount = accounts[0];
    if (!activeAccount || !activeAccount.username) {
      console.log('No valid active account found');
      return false;
    }

    // Additional check: verify if we have user data in localStorage (from UserAvatar component)
    const userData = localStorage.getItem('userData');
    if (!userData) {
      console.log('No user data in localStorage - user may not be fully authenticated');
      return false;
    }

    console.log('User is authenticated:', activeAccount.username);
    return true;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

// Helper function to get current logged-in user information
const getLoggedInUserInfo = () => {
  try {
    // Get user data from localStorage (set by UserAvatar component)
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);

      // Get MSAL account for additional user info
      const accounts = msalInstance.getAllAccounts();
      const activeAccount = accounts[0];

      return {
        fullName: parsedUserData.displayName || activeAccount?.name || "",
        username: activeAccount?.username || "",
        email: activeAccount?.username || "" // username is typically the email in MSAL
      };
    }

    // Fallback: try to get info directly from MSAL account
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      const activeAccount = accounts[0];
      return {
        fullName: activeAccount.name || "",
        username: activeAccount.username || "",
        email: activeAccount.username || ""
      };
    }

    // No user information available
    return {
      fullName: "",
      username: "",
      email: ""
    };
  } catch (error) {
    console.error('Error getting user information:', error);
    return {
      fullName: "",
      username: "",
      email: ""
    };
  }
};

export async function updateTaskStatus(task: Task, newStatus: string): Promise<UpdateTaskStatusResponse> {
  // Check if user is authenticated before proceeding
  console.log('Checking authentication status for updateTaskStatus...');
  const isAuthenticated = isUserLoggedIn();
  console.log('Authentication check result:', isAuthenticated);

  if (!isAuthenticated) {
    // Throw specific authentication error to be handled by UI
    throw new Error('AUTHENTICATION_REQUIRED');
  }

  const UPDATE_STATUS_URL = 'https://homeapi.quixy.com/api/App/SaveAppData?appName=Change%20Issue%20Status&users=&startDate=null&dueDate=null';

  // Extract task data from rowData
  const taskData = task.rowData || {};
  const currentDateTime = new Date().toISOString();

  // Get current Project ID
  const projectId = taskData['Project Id'] || getCurrentProjectId();

  // Get authenticated user information
  const userInfo = getLoggedInUserInfo();

  // Validate that we have user information
  if (!userInfo.email || !userInfo.fullName) {
    alert('Unable to retrieve user information. Please try logging in again.');
    throw new Error('User information not available. Please re-authenticate.');
  }

  const payload = {
    "var Project Id": projectId,
    "var Issue Record Id": taskData['Record Id'] || "",
    "var Issue Id": taskData['Issue Id'] || "",
    "Issue Id": null,
    "Status": "",
    "Project Id": projectId,
    "var Issue Type": taskData['Issue Type'] || "",
    "Issue Type": taskData['Issue Type'] || "",
    "var Current Assignee": taskData['Assignee'] || "",
    "var Issue Current Status": taskData['Status'] || "",
    "var Summary": taskData['Summary'] || "",
    "Current Status": taskData['Status'] || "",
    "Estimated Hours": taskData['Estimated Hours'] || "",
    "Detection Phase": taskData['Detection Phase'] || "",
    "New Status": newStatus,
    "Change Remarks": "",
    "Release Datetime": "",
    "Review Closed Task By": "",
    "Configurations": "",
    "Scripts": "",
    "Environment level": "",
    "Specific details": "",
    "Select Branch": "",
    "Select Required Components": "",
    "Any DB Scripts Exists": "",
    "Issue Remarks": "",
    "Mention the DB script": "",
    "Any configuration changes made": "",
    "Specify the configuration change": "",
    "Configurations added": "",
    "DB Scripts": "",
    "Migration scripts": "",
    "Configurations Files": "",
    "DB Files": "",
    "Migration files": "",
    "Dev Remarks": "",
    "Specify Impact Feature Related To Bug": "",
    "Var Sub Task Id": "",
    "status Indicator Project Id": projectId,
    "status Indicator Issue Type": taskData['Issue Type'] || "",
    "status Indicator Status": taskData['Status'] || "",
    "Status Indicator": taskData['Status Indicator'] || "In Progress",
    "Updated Date Time": currentDateTime,
    "Issue Id for watch": null,
    "Logged In User Name": userInfo.fullName,
    "Watch List Details": [],
    "Assignee Story Points": null,
    "Status Changed User": taskData['Team Member Email Id'] || userInfo.email,
    "Sprint Name": taskData['Sprint Name'] || "",
    "Story points Issue Id": taskData['Issue Id'] || "",
    "Get Assignee Story Points": "",
    "Story Sub Task Id": null,
    "Sub task Story Points": "",
    "Get ready for QA Issue id": null,
    "Get ready for QA Issue id Grid": "",
    "_AppId": "01022021-064254831-3920198f-f15c-4ea9-b8f3-22913911c281",
    "_AppName": "Change Issue Status",
    "_CurrentStepNumber": 1,
    "_WorkSpaceId": "03012021-192624661-c4d2d235-e371-4983-973f-c82b074f9b21",
    "_OrganizationId": "29102019-093434548-a4fe41b0-1fd0-489a-ac08-a29b98883143",
    "_NextGroupName": "Done",
    "_IsCompleted": true,
    "_ExternalApiIds": "",
    "_InternalApiIds": "",
    "_DataFunctionIds": "",
    "_UserFunctionIds": "",
    "_UserId": "17062024-181413146-241121e4-6644-481f-a0ea-ddf9e3832575",
    "_Username": userInfo.username,
    "_FullName": userInfo.fullName,
    "_UpdatedUserId": "",
    "_UpdatedUsername": "",
    "_UpdatedEmailId": "",
    "_UserEmailId": userInfo.email,
    "_NextStepUsers": "",
    "_UpdatedLocation": "",
    "_WorkFlowAction": "Start - Submit"
  };

  try {
    console.log('Making status update API request to:', UPDATE_STATUS_URL);
    console.log('Update payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(UPDATE_STATUS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Update response status:', response.status);
    console.log('Update response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update response error text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Update API response:', data);

    return {
      Status: data.Status || true,
      results: data.results,
      message: data.message
    };
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

// Attendance Report Types
interface AttendanceReportFilter {
  ElementType: string;
  LabelName: string;
  Condition: string;
  Type: string;
  DefaultValue: string;
  SecondValue: string;
  MappingType: string;
}

interface AttendanceReportPayload {
  reportId: string;
  skip: number;
  top: number;
  orderByFields: string;
  filters: AttendanceReportFilter[];
  groupAggregate: null;
  isShowGrid: boolean;
}

export interface AttendanceRecord {
  "S No": number;
  "Employee Code": string;
  "Attendance Id": string;
  "Employee Name": string;
  "Department": string;
  "Reporting Manager Name": string;
  "Employee Email Id": string;
  "Date": string;
  "Day": string;
  "In Time": string;
  "Out Time": string;
  "Total Hours": string;
  "Greater than 10AM and Less than 5PM": string;
  "Less than 7 Hours": string;
  "Attendance Type": string;
  "Balance Day Period": string;
  "Application 1 Status": string;
  "Application 2 Status": string;
  "Application 1 Pending With": string;
  "Application 2 Pending With": string;
  "Punch Status": string;
  "Total Log Hours": number;
  "Log Hours Before 11 AM": number;
  "Log Hours After 11 AM": number;
  "First Log DateTime": string;
  "Last Log DateTime": string;
  "cutoffdatetime": string;
  "No of Times Logged": number;
  "Log Status": string;
  "Month": string;
  "Year": string;
  "First Half": string;
  "Second Half": string;
}

interface AttendanceReportResponse {
  Status: boolean;
  results: string;
  __count: number;
}

/**
 * Fetches attendance report data for a given date range
 * @param fromDate - Start date in YYYY-MM-DD format
 * @param toDate - End date in YYYY-MM-DD format
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Array of attendance records
 */
export async function fetchAttendanceReport(fromDate: string, toDate: string, signal?: AbortSignal): Promise<AttendanceRecord[]> {
  const ATTENDANCE_API_URL = 'https://homeapi.quixy.com/api/Report/GetGridReportData';
  const REPORT_ID = '12092025-150408108-76d54cf3-0490-441a-bb2d-77eefd4f9ece';
  const PAGE_SIZE = 50;

  let skip = 0;
  let allRecords: AttendanceRecord[] = [];
  let totalCount = 0;
  let hasMore = true;

  // Convert dates to ISO format with time (6:30 AM UTC = 12:00 PM IST start of day)
  const formatDateForApi = (dateStr: string): string => {
    // dateStr is in YYYY-MM-DD format
    return `${dateStr}T06:30:00.000Z`;
  };

  try {
    console.log(`Fetching attendance report from ${fromDate} to ${toDate}`);

    while (hasMore) {
      const payload: AttendanceReportPayload = {
        reportId: REPORT_ID,
        skip: skip,
        top: PAGE_SIZE,
        orderByFields: "",
        filters: [
          {
            ElementType: "Date",
            LabelName: "Fromdate",
            Condition: "Exact Date",
            Type: "textType",
            DefaultValue: formatDateForApi(fromDate),
            SecondValue: "",
            MappingType: "Mapped"
          },
          {
            ElementType: "Date",
            LabelName: "Todate",
            Condition: "Exact Date",
            Type: "textType",
            DefaultValue: formatDateForApi(toDate),
            SecondValue: "",
            MappingType: "Mapped"
          }
        ],
        groupAggregate: null,
        isShowGrid: false
      };

      console.log(`Fetching attendance page: skip=${skip}, top=${PAGE_SIZE}`);

      const response = await fetch(ATTENDANCE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getApiToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: signal, // Pass abort signal to fetch
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Attendance API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: AttendanceReportResponse = await response.json();

      // Note: This API returns Status: false even with valid results
      // So we check for the presence of results instead
      if (!data.results) {
        throw new Error('Attendance API returned no results');
      }

      // Store total count from first response
      if (skip === 0) {
        totalCount = data.__count;
        console.log(`Total attendance records available: ${totalCount}`);
      }

      // Parse the results string into an array of records
      const records: AttendanceRecord[] = JSON.parse(data.results);
      console.log(`Fetched ${records.length} attendance records in this batch`);

      // Add to our collection
      allRecords = [...allRecords, ...records];

      // Check if we have more pages to fetch
      skip += PAGE_SIZE;
      hasMore = allRecords.length < totalCount && records.length === PAGE_SIZE;
    }

    console.log(`Finished fetching all attendance records. Total: ${allRecords.length}`);
    return allRecords;
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    throw error;
  }
}

export async function checkTaskStatus(issueType: string, currentStatus: string, projectId?: string): Promise<StatusCheckResponse> {
  const STATUS_CHECK_URL = 'https://homeapi.quixy.com/api/DataTable/GetDataTableDataByReference';

  // Determine which Project ID to use
  let effectiveProjectId: string;

  if (projectId) {
    // Use the provided Project ID
    effectiveProjectId = projectId;
  } else if (currentProjectId) {
    // Use the stored Project ID from the last fetchTasks call
    effectiveProjectId = currentProjectId;
    console.log('Using stored Project ID from last fetchTasks call:', currentProjectId);
  } else {
    // Fallback to default Project ID if no Project ID is available
    effectiveProjectId = "70";
    console.warn('No Project ID available, using fallback value "70". Make sure fetchTasks has been called at least once.');
  }

  console.log('Using Project ID for status check:', effectiveProjectId);

  const payload = {
    DataTableFunctionId: "01022021-064148735-3f601026-cf68-4b03-abd5-ca71c5215f97",
    DataTableId: "03012021-220616917-65360d6b-ab63-4cf6-9977-2d6c91e005d8",
    ReferencedElements: "",
    DataTableDataReferenceDataDTOs: [
      {
        IsFocused: false,
        ReferenceName: "Project Id",
        Value: effectiveProjectId,
        SelectedValue: ""
      },
      {
        IsFocused: false,
        ReferenceName: "Issue Type",
        Value: issueType,
        SelectedValue: ""
      },
      {
        IsFocused: false,
        ReferenceName: "Current Status",
        Value: currentStatus,
        SelectedValue: ""
      },
      {
        IsFocused: true,
        ReferenceName: "Next Status",
        Value: "",
        SelectedValue: ""
      }
    ]
  };

  try {
    console.log('Making API request to:', STATUS_CHECK_URL);
    console.log('Request payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(STATUS_CHECK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Full API response:', data);
    console.log('API response type:', Array.isArray(data) ? 'Array' : 'Object');

    // Check if the response is directly an array (the actual data)
    if (Array.isArray(data)) {
      console.log('Response is an array, treating as direct data');
      // Return in the expected format
      const formattedResponse: StatusCheckResponse = {
        Status: true,
        results: JSON.stringify(data),
        __count: data.length
      };
      console.log('Formatted response:', formattedResponse);
      return formattedResponse;
    }

    // Handle the original expected format
    console.log('API response Status field:', data.Status);
    console.log('API response results field:', data.results);

    if (!data.Status) {
      console.error('API returned unsuccessful status. Full response:', data);
      throw new Error('API returned unsuccessful status');
    }

    return data;
  } catch (error) {
    console.error('Error checking task status:', error);
    throw error;
  }
}