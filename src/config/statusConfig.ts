export const statusOrder = [
  'Reopened',
  'Hold',
  'New',
  'Requirement Gathering',
  'Design',
  'Design Review',
  'Design Completed',
  'Ready for TC Preparation',
  'Test Case Preparation',
  'Test Case Review',
  'Test Case Completed',
  'Technical Document Review',
  'In Progress',
  'Coding',
  'Unit Testing',
  'White Box Testing',
  'Coding Review',
  'Devbox Testing',
  'Ready for QA',
  'System Testing',
  'Closed',
  'Release',
  'Other Status'
] as const;

export type Status = typeof statusOrder[number];

// Helper function to get status order index
export function getStatusOrder(status: string): number {
  const index = statusOrder.indexOf(status as Status);
  return index === -1 ? statusOrder.length - 1 : index; // Return last index for unknown statuses
}

// Helper function to check if a status is valid
export function isValidStatus(status: string): boolean {
  return statusOrder.includes(status as Status);
}