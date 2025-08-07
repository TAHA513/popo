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
  return reservedUsernames.includes(username.toLowerCase());
}

export function getReservedUsernameError(): string {
  return "هذا الاسم محجوز ولا يمكن استخدامه - يرجى اختيار اسم مستخدم آخر";
}