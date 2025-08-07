// Reserved usernames that cannot be used by anyone
export const reservedUsernames = [
  // Official LaaBoBo variations - STRICTLY PROTECTED
  'LaaBoBo', 'laabobe', 'LAABOBE', 'Laabobe', 'laaBoBo', 'laaboBo', 'lAaBoBo',
  'la_bo_bo', 'la-bo-bo', 'la.bo.bo', 'laabo.bo', 'laa.bobo',
  
  // System/Admin usernames
  'admin', 'administrator', 'root', 'owner', 'official',
  'support', 'help', 'system', 'api', 'www', 'mail',
  'test', 'demo', 'guest', 'user', 'public', 'private',
  
  // Technical/Platform reserved
  'moderator', 'mod', 'staff', 'team', 'service', 'security',
  'info', 'contact', 'news', 'blog', 'dev', 'developer',
  'analytics', 'stats', 'reports', 'billing', 'payment',
  
  // Arabic variations
  'لابوبو', 'لاا_بوبو', 'لاا-بوبو', 'إدارة', 'مساعدة', 'دعم',
  'رسمي', 'نظام', 'خدمة', 'فريق', 'موقع'
];

export function isUsernameReserved(username: string): boolean {
  // Clean the username by removing spaces, special characters, and normalizing
  const cleanedUsername = username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[._-]/g, '') // Remove dots, underscores, dashes
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and similar
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  
  // Check against all reserved usernames with same cleaning
  return reservedUsernames.some(reserved => {
    const cleanedReserved = reserved
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[._-]/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return cleanedUsername === cleanedReserved || 
           cleanedUsername.includes(cleanedReserved) ||
           cleanedReserved.includes(cleanedUsername);
  });
}

export function getReservedUsernameError(): string {
  return "هذا الاسم محجوز ولا يمكن استخدامه - يرجى اختيار اسم مستخدم آخر";
}