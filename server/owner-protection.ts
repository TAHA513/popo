// Owner account protection system
// This file contains utilities to protect ONLY the admin owner account from appearing in public lists
// The verified official account (LaaBoBo) should remain visible to users

export const ADMIN_OWNER_EMAIL = 'fnnm945@gmail.com';
export const ADMIN_OWNER_USERNAME = 'LaaBoBo_Owner';

// Function to check if a user is the protected admin owner account
export function isOwnerAccount(user: { username?: string; email?: string }): boolean {
  // Only hide the admin owner account, not the official verified account
  return user.username === ADMIN_OWNER_USERNAME || user.email === ADMIN_OWNER_EMAIL;
}

// Function to check if username is the admin owner username
export function isOwnerUsername(username: string): boolean {
  return username === ADMIN_OWNER_USERNAME;
}

// Function to check if email is the admin owner email
export function isOwnerEmail(email: string): boolean {
  return email === ADMIN_OWNER_EMAIL;
}

// Function to filter out owner from user arrays
export function filterOwnerFromUsers<T extends { username?: string; email?: string }>(users: T[]): T[] {
  return users.filter(user => !isOwnerAccount(user));
}

// Function to log owner protection activity
export function logOwnerProtection(context: string, filteredCount: number = 0): void {
  console.log(`🛡️ Owner protection active in ${context}. Filtered ${filteredCount} entries.`);
}