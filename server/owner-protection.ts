// Owner account protection system
// This file contains utilities to protect the owner account from appearing in public lists

export const OWNER_EMAIL = 'fnnm945@gmail.com';

// Function to check if a user is the owner
export function isOwnerAccount(username: string): boolean {
  return username === OWNER_EMAIL;
}

// Function to filter out owner from user arrays
export function filterOwnerFromUsers<T extends { username: string }>(users: T[]): T[] {
  return users.filter(user => !isOwnerAccount(user.username));
}

// Function to log owner protection activity
export function logOwnerProtection(context: string, filteredCount: number = 0): void {
  console.log(`🛡️ Owner protection active in ${context}. Filtered ${filteredCount} entries.`);
}