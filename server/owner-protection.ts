// Owner account protection system
// This file contains utilities to protect the owner account from appearing in public lists

export const OWNER_EMAIL = 'fnnm945@gmail.com';
export const OWNER_USERNAME = 'LaaBoBo_Owner';

// Function to check if a user is the owner (by email or username)
export function isOwnerAccount(user: { username?: string; email?: string }): boolean {
  return user.username === OWNER_USERNAME || user.email === OWNER_EMAIL;
}

// Function to check if username is the owner username
export function isOwnerUsername(username: string): boolean {
  return username === OWNER_USERNAME;
}

// Function to check if email is the owner email
export function isOwnerEmail(email: string): boolean {
  return email === OWNER_EMAIL;
}

// Function to filter out owner from user arrays
export function filterOwnerFromUsers<T extends { username?: string; email?: string }>(users: T[]): T[] {
  return users.filter(user => !isOwnerAccount(user));
}

// Function to log owner protection activity
export function logOwnerProtection(context: string, filteredCount: number = 0): void {
  console.log(`🛡️ Owner protection active in ${context}. Filtered ${filteredCount} entries.`);
}