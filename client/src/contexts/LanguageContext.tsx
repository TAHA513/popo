import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LanguageOption {
  code: 'en' | 'ar';
  name: string;
  localName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const languages: LanguageOption[] = [
  {
    code: 'ar',
    name: 'Arabic',
    localName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦'
  },
  {
    code: 'en',
    name: 'English',
    localName: 'English',
    direction: 'ltr',
    flag: '🇺🇸'
  }
];

interface LanguageContextType {
  currentLanguage: LanguageOption;
  setLanguage: (language: LanguageOption) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = {
  ar: {
    // Login Page
    'login.welcome': 'مرحباً بعودتك',
    'login.username': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.button': 'تسجيل الدخول',
    'login.signing_in': 'جاري تسجيل الدخول...',
    'login.forgot_password': 'نسيت كلمة المرور؟',
    'login.error': 'خطأ',
    'login.success': 'تم بنجاح',
    
    // Navigation & Pages
    'nav.home': 'الرئيسية',
    'nav.explore': 'اكتشف',
    'nav.messages': 'الرسائل',
    'nav.notifications': 'الإشعارات',
    'nav.profile': 'الملف الشخصي',
    'nav.account': 'إدارة الحساب',
    'nav.wallet': 'المحفظة',
    'nav.gifts': 'الهدايا',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    
    // Home Page
    'home.title': 'مرحباً بك في LaaBoBo Live',
    'home.subtitle': 'منصة البث المباشر الأكثر تفاعلاً',
    'home.start_streaming': 'بدء البث',
    'home.explore_content': 'استكشف المحتوى',
    'home.recent_memories': 'الذكريات الحديثة',
    'home.no_memories': 'لا توجد ذكريات حالياً',
    'home.create_memory': 'إنشاء ذكرى جديدة',
    'home.live_streams': 'البث المباشر',
    'home.trending': 'الشائع',
    
    // Explore Page
    'explore.title': 'استكشف',
    'explore.live_streams': 'البث المباشر',
    'explore.categories': 'الفئات',
    'explore.trending': 'الشائع',
    'explore.new': 'جديد',
    'explore.popular': 'الأكثر شعبية',
    'explore.no_streams': 'لا توجد بثوث مباشرة حالياً',
    
    // Messages
    'messages.title': 'الرسائل',
    'messages.conversations': 'المحادثات',
    'messages.requests': 'طلبات الرسائل',
    'messages.no_conversations': 'لا توجد محادثات',
    'messages.new_message': 'رسالة جديدة',
    'messages.type_message': 'اكتب رسالة...',
    'messages.send': 'إرسال',
    'messages.online': 'متصل',
    'messages.offline': 'غير متصل',
    'messages.typing': 'يكتب...',
    
    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.mark_all_read': 'تحديد الكل كمقروء',
    'notifications.no_notifications': 'لا توجد إشعارات',
    'notifications.new_follower': 'متابع جديد',
    'notifications.new_gift': 'هدية جديدة',
    'notifications.new_message': 'رسالة جديدة',
    'notifications.stream_started': 'بدء البث',
    
    // Profile
    'profile.title': 'الملف الشخصي',
    'profile.edit_profile': 'تعديل الملف الشخصي',
    'profile.followers': 'المتابعون',
    'profile.following': 'يتابع',
    'profile.memories': 'الذكريات',
    'profile.albums': 'الألبومات',
    'profile.gifts_received': 'الهدايا المستلمة',
    'profile.follow': 'متابعة',
    'profile.unfollow': 'إلغاء المتابعة',
    'profile.message': 'راسل',
    'profile.send_gift': 'إرسال هدية',
    'profile.first_name': 'الاسم الأول',
    'profile.last_name': 'الاسم الأخير',
    'profile.email': 'البريد الإلكتروني',
    'profile.account_type': 'نوع الحساب',
    'profile.save_changes': 'حفظ التغييرات',
    'profile.click_camera': 'انقر على الكاميرا لتغيير الصورة',
    'profile.personal_info': 'المعلومات الشخصية',
    
    // Gifts
    'gifts.title': 'الهدايا',
    'gifts.send_gift': 'إرسال هدية',
    'gifts.received': 'المستلمة',
    'gifts.sent': 'المرسلة',
    'gifts.characters': 'الشخصيات',
    'gifts.select_character': 'اختر شخصية',
    'gifts.confirm_send': 'تأكيد الإرسال',
    'gifts.gift_sent': 'تم إرسال الهدية',
    'gifts.insufficient_points': 'نقاط غير كافية',
    
    // Settings
    'settings.app_settings': 'إعدادات التطبيق',
    'settings.language': 'اللغة',
    'settings.language_desc': 'اختر لغة التطبيق',
    'settings.notifications': 'الإشعارات',
    'settings.notifications_desc': 'تلقي إشعارات الهدايا والرسائل',
    'settings.privacy': 'الخصوصية',
    'settings.privacy_desc': 'إدارة إعدادات الخصوصية',
    'settings.enable': 'تفعيل',
    'settings.manage': 'إدارة',
    'settings.theme': 'المظهر',
    'settings.dark_mode': 'الوضع المظلم',
    'settings.light_mode': 'الوضع الفاتح',
    
    // Wallet
    'wallet.title': 'المحفظة',
    'wallet.digital_wallet': 'المحفظة الرقمية',
    'wallet.current_points': 'النقاط الحالية',
    'wallet.total_earnings': 'إجمالي الأرباح',
    'wallet.gifts_sent': 'الهدايا المرسلة',
    'wallet.buy_points': 'شراء نقاط',
    'wallet.withdraw': 'سحب الأرباح',
    'wallet.transaction_history': 'تاريخ المعاملات',
    'wallet.points_packages': 'باقات النقاط',
    
    // Streaming
    'stream.start_streaming': 'ابدأ بث',
    'stream.stop_streaming': 'إيقاف البث',
    'stream.viewers': 'المشاهدون',
    'stream.chat': 'الدردشة',
    'stream.settings': 'إعدادات البث',
    'stream.camera': 'الكاميرا',
    'stream.microphone': 'المايكروفون',
    'stream.screen_share': 'مشاركة الشاشة',
    'stream.beauty_filters': 'فلاتر الجمال',
    
    // Security
    'security.title': 'الأمان والحماية',
    'security.current_password': 'كلمة المرور الحالية',
    'security.new_password': 'كلمة المرور الجديدة',
    'security.confirm_password': 'تأكيد كلمة المرور',
    'security.update_password': 'تحديث كلمة المرور',
    'security.two_factor': 'المصادقة الثنائية',
    'security.login_history': 'تاريخ تسجيل الدخول',
    
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.update': 'تحديث',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.confirm': 'تأكيد',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.search': 'بحث',
    'common.filter': 'فلتر',
    'common.sort': 'ترتيب',
    'common.view_all': 'عرض الكل',
    'common.show_more': 'عرض المزيد',
    'common.show_less': 'عرض أقل',
    
    // Account Types
    'account.user': 'مستخدم',
    'account.admin': 'مدير',
    'account.super_admin': 'مدير عام',
    'account.verified': 'موثق',
    
    // Profile Tabs
    'profile.tabs.memories': 'الذكريات',
    'profile.tabs.followers': 'المتابعون',
    'profile.tabs.following': 'يتابع',
    'profile.tabs.albums': 'الألبومات',
    'profile.back': 'العودة',
    
    // Gift Rarities
    'gifts.rarity.common': 'عادي',
    'gifts.rarity.rare': 'نادر',
    'gifts.rarity.epic': 'أسطوري',
    'gifts.rarity.legendary': 'خرافي',
    
    // Memory Types
    'memory.flash': 'برق',
    'memory.trending': 'ترند',
    'memory.star': 'نجمة',
    'memory.legend': 'أسطورة',
    'memory.permanent': 'دائم',
    'memory.create': 'إنشاء ذكرى',
    'memory.upload': 'رفع',
    'memory.camera': 'كاميرا',
    'memory.gallery': 'المعرض',
    'memory.no_content': 'لا يوجد محتوى',
    'memory.expired': 'انتهت صلاحيتها',
    
    // Chat & Communication
    'chat.online': 'متصل',
    'chat.offline': 'غير متصل',
    'chat.typing': 'يكتب...',
    'chat.send_message': 'إرسال رسالة',
    'chat.message_sent': 'تم إرسال الرسالة',
    'chat.no_messages': 'لا توجد رسائل',
    'chat.start_conversation': 'بدء محادثة',
    'chat.private_room': 'غرفة خاصة',
    'chat.group_room': 'غرفة جماعية',
    
    // Buttons & Actions
    'buttons.follow': 'متابعة',
    'buttons.unfollow': 'إلغاء المتابعة',
    'buttons.message': 'راسل',
    'buttons.call': 'اتصل',
    'buttons.video_call': 'مكالمة فيديو',
    'buttons.share': 'مشاركة',
    'buttons.like': 'إعجاب',
    'buttons.comment': 'تعليق',
    'buttons.report': 'إبلاغ',
    'buttons.block': 'حظر',
    'buttons.add_friend': 'إضافة صديق',
    'buttons.remove_friend': 'إزالة صديق',
    
    // Status & States
    'status.online': 'متصل',
    'status.offline': 'غير متصل',
    'status.away': 'غائب',
    'status.busy': 'مشغول',
    'status.invisible': 'غير مرئي',
    'status.last_seen': 'آخر ظهور',
    'status.active_now': 'نشط الآن',
    
    // Time & Dates
    'time.now': 'الآن',
    'time.minute_ago': 'منذ دقيقة',
    'time.minutes_ago': 'منذ دقائق',
    'time.hour_ago': 'منذ ساعة',
    'time.hours_ago': 'منذ ساعات',
    'time.day_ago': 'منذ يوم',
    'time.days_ago': 'منذ أيام',
    'time.week_ago': 'منذ أسبوع',
    'time.weeks_ago': 'منذ أسابيع',
    'time.month_ago': 'منذ شهر',
    'time.months_ago': 'منذ شهور',
    
    // Error Messages
    'error.network': 'خطأ في الشبكة',
    'error.server': 'خطأ في الخادم',
    'error.not_found': 'غير موجود',
    'error.unauthorized': 'غير مخول',
    'error.forbidden': 'ممنوع',
    'error.invalid_data': 'بيانات غير صحيحة',
    'error.file_too_large': 'الملف كبير جداً',
    'error.unsupported_format': 'تنسيق غير مدعوم',
    
    // Success Messages
    'success.saved': 'تم الحفظ',
    'success.updated': 'تم التحديث',
    'success.deleted': 'تم الحذف',
    'success.uploaded': 'تم الرفع',
    'success.sent': 'تم الإرسال',
    'success.received': 'تم الاستلام',
    
    // Loading States
    'loading.please_wait': 'يرجى الانتظار...',
    'loading.uploading': 'جاري الرفع...',
    'loading.downloading': 'جاري التحميل...',
    'loading.processing': 'جاري المعالجة...',
    'loading.connecting': 'جاري الاتصال...',
    
    // Gift Actions (Additional)
    'gifts.no_gifts': 'لا توجد هدايا متاحة حالياً',
    'gifts.try_later': 'يرجى المحاولة لاحقاً',
    'gifts.loading': 'جاري تحميل الهدايا...',
    'gifts.error_loading': 'خطأ في تحميل الهدايا',
    'gifts.retry': 'إعادة المحاولة',
    
    // Authentication Pages
    'auth.register': 'إنشاء حساب',
    'auth.login': 'تسجيل الدخول',
    'auth.forgot_password': 'نسيت كلمة المرور',
    'auth.back_to_login': 'العودة لتسجيل الدخول',
    'auth.first_name': 'الاسم الأول',
    'auth.last_name': 'الاسم الأخير',
    'auth.username': 'اسم المستخدم',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirm_password': 'تأكيد كلمة المرور',
    'auth.country': 'الدولة',
    'auth.select_country': 'اختر دولتك',
    'auth.creating_account': 'جاري إنشاء الحساب...',
    'auth.logging_in': 'جاري تسجيل الدخول...',
    'auth.sending_reset': 'جاري الإرسال...',
    'auth.send_reset_link': 'إرسال رابط الاستعادة',
    'auth.already_have_account': 'لديك حساب بالفعل؟',
    'auth.dont_have_account': 'ليس لديك حساب؟',
    'auth.register_now': 'إنشاء حساب الآن',
    'auth.sign_in_here': 'سجل دخولك هنا',
    'auth.username_available': 'اسم المستخدم متاح',
    'auth.username_taken': 'اسم المستخدم مستخدم بالفعل',
    'auth.checking_username': 'جاري التحقق...',
    'auth.registration_error': 'حدث خطأ أثناء إنشاء الحساب',
    'auth.reset_error': 'حدث خطأ أثناء إرسال رابط الاستعادة',
    'auth.success_title': 'تم بنجاح',
    'auth.error_title': 'خطأ',
    'auth.reset_password_error': 'حدث خطأ أثناء تعيين كلمة المرور',
    'auth.create_new_account': 'إنشاء حساب جديد',
    'auth.join_community': 'انضم إلى مجتمع LaaBoBo Live',
    
    // Account & Profile
    'account.image_updated': 'تم تحديث الصورة',
    'account.image_updated_success': 'تم تحديث صورتك الشخصية بنجاح',
    'account.upload_failed': 'فشل رفع الصورة. حاول مرة أخرى.',
    
    // Upload
    'upload.file_too_large': 'الملف كبير جداً',
    'upload.image_size_limit': 'الحد الأقصى لحجم الصورة هو 5 ميجابايت',

    // Navigation Additional
    'nav.start_stream': 'ابدأ البث',
    'nav.back': 'العودة',

    // Stream/Chat
    'stream.create_new_chat': 'إنشاء دردشة جديدة',
    'stream.quick_chat': 'دردشة سريعة جديدة',
    'stream.text_only': 'دردشة مباشرة نصية',
    'stream.quick_category': 'دردشة سريعة',
    'stream.creation_failed': 'فشل في إنشاء الدردشة',
    'stream.login_required': 'يجب تسجيل الدخول أولاً',
    'stream.no_permission': 'ليس لديك صلاحية لإنشاء دردشة',
    'stream.title_placeholder': 'أدخل عنوان الدردشة',
    'stream.description_placeholder': 'وصف مختصر للدردشة',
    'stream.creating': 'جاري الإنشاء...',
    'stream.create_button': 'إنشاء الدردشة',
    'stream.text_only_desc': 'دردشة نصية فقط',
    'stream.participants_can_join': 'يمكن للمستخدمين الانضمام وإرسال الرسائل النصية',

    // Validation
    'validation.title_required': 'يرجى إدخال عنوان للدردشة',

    // Additional Stream/Chat Fields
    'stream.chat_details': 'تفاصيل الدردشة',
    'stream.chat_title': 'عنوان الدردشة',
    'stream.chat_description': 'وصف الدردشة',

    // Profile Additional
    'profile.laaboboo_user': 'مستخدم LaaBoBo',
    'profile.user_points': 'النقاط',
    'profile.user_followers': 'المتابعون',
    'profile.user_likes': 'الإعجابات',
    'profile.user_comments': 'التعليقات',
    'profile.user_shares': 'المشاركات',
    'profile.user_gifts': 'الهدايا',
    'profile.protected_albums': 'الألبومات المحمية',
    'profile.view_albums': 'عرض الألبومات',
    'profile.create_album': 'إنشاء ألبوم',
    'profile.no_locked_albums': 'لا توجد ألبومات محمية',
    'profile.create_first_album': 'قم بإنشاء أول ألبوم محمي لك',
    'profile.my_content': 'المحتوى الخاص بي',
    'profile.user_memories': 'الذكريات',
    'profile.user_videos': 'الفيديوهات',
    'profile.account_settings': 'الإعدادات',
    'profile.user_wallet': 'المحفظة',
    'profile.platform_policies': 'السياسات',
    'profile.logout_action': 'تسجيل الخروج',
    'profile.albums_count': 'لديك {count} ألبوم محمي',
    'memory.type_short': 'ذكرى',
    'common.user': 'مستخدم',
  },
  en: {
    // Login Page
    'login.welcome': 'Welcome back',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.button': 'Sign In',
    'login.signing_in': 'Signing in...',
    'login.forgot_password': 'Forgot password?',
    'login.error': 'Error',
    'login.success': 'Success',
    
    // Navigation & Pages
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Profile',
    'nav.account': 'Account Management',
    'nav.wallet': 'Wallet',
    'nav.gifts': 'Gifts',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Home Page
    'home.title': 'Welcome to LaaBoBo Live',
    'home.subtitle': 'The Most Interactive Live Streaming Platform',
    'home.start_streaming': 'Start Streaming',
    'home.explore_content': 'Explore Content',
    'home.recent_memories': 'Recent Memories',
    'home.no_memories': 'No memories yet',
    'home.create_memory': 'Create New Memory',
    'home.live_streams': 'Live Streams',
    'home.trending': 'Trending',
    
    // Explore Page
    'explore.title': 'Explore',
    'explore.live_streams': 'Live Streams',
    'explore.categories': 'Categories',
    'explore.trending': 'Trending',
    'explore.new': 'New',
    'explore.popular': 'Popular',
    'explore.no_streams': 'No live streams currently',
    
    // Messages
    'messages.title': 'Messages',
    'messages.conversations': 'Conversations',
    'messages.requests': 'Message Requests',
    'messages.no_conversations': 'No conversations yet',
    'messages.new_message': 'New Message',
    'messages.type_message': 'Type a message...',
    'messages.send': 'Send',
    'messages.online': 'Online',
    'messages.offline': 'Offline',
    'messages.typing': 'Typing...',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.mark_all_read': 'Mark All as Read',
    'notifications.no_notifications': 'No notifications',
    'notifications.new_follower': 'New Follower',
    'notifications.new_gift': 'New Gift',
    'notifications.new_message': 'New Message',
    'notifications.stream_started': 'Stream Started',
    
    // Profile
    'profile.title': 'Profile',
    'profile.edit_profile': 'Edit Profile',
    'profile.followers': 'Followers',
    'profile.following': 'Following',
    'profile.memories': 'Memories',
    'profile.albums': 'Albums',
    'profile.gifts_received': 'Gifts Received',
    'profile.follow': 'Follow',
    'profile.unfollow': 'Unfollow',
    'profile.message': 'Message',
    'profile.send_gift': 'Send Gift',
    'profile.first_name': 'First Name',
    'profile.last_name': 'Last Name',
    'profile.email': 'Email',
    'profile.account_type': 'Account Type',
    'profile.save_changes': 'Save Changes',
    'profile.click_camera': 'Click camera to change picture',
    'profile.personal_info': 'Personal Information',
    
    // Gifts
    'gifts.title': 'Gifts',
    'gifts.send_gift': 'Send Gift',
    'gifts.received': 'Received',
    'gifts.sent': 'Sent',
    'gifts.characters': 'Characters',
    'gifts.select_character': 'Select Character',
    'gifts.confirm_send': 'Confirm Send',
    'gifts.gift_sent': 'Gift Sent',
    'gifts.insufficient_points': 'Insufficient Points',
    
    // Settings
    'settings.app_settings': 'App Settings',
    'settings.language': 'Language',
    'settings.language_desc': 'Choose your app language',
    'settings.notifications': 'Notifications',
    'settings.notifications_desc': 'Receive gift and message notifications',
    'settings.privacy': 'Privacy',
    'settings.privacy_desc': 'Manage privacy settings',
    'settings.enable': 'Enable',
    'settings.manage': 'Manage',
    'settings.theme': 'Theme',
    'settings.dark_mode': 'Dark Mode',
    'settings.light_mode': 'Light Mode',
    
    // Wallet
    'wallet.title': 'Wallet',
    'wallet.digital_wallet': 'Digital Wallet',
    'wallet.current_points': 'Current Points',
    'wallet.total_earnings': 'Total Earnings',
    'wallet.gifts_sent': 'Gifts Sent',
    'wallet.buy_points': 'Buy Points',
    'wallet.withdraw': 'Withdraw Earnings',
    'wallet.transaction_history': 'Transaction History',
    'wallet.points_packages': 'Points Packages',
    
    // Streaming
    'stream.start_streaming': 'Start Streaming',
    'stream.stop_streaming': 'Stop Streaming',
    'stream.viewers': 'Viewers',
    'stream.chat': 'Chat',
    'stream.settings': 'Stream Settings',
    'stream.camera': 'Camera',
    'stream.microphone': 'Microphone',
    'stream.screen_share': 'Screen Share',
    'stream.beauty_filters': 'Beauty Filters',
    
    // Security
    'security.title': 'Security & Protection',
    'security.current_password': 'Current Password',
    'security.new_password': 'New Password',
    'security.confirm_password': 'Confirm Password',
    'security.update_password': 'Update Password',
    'security.two_factor': 'Two-Factor Authentication',
    'security.login_history': 'Login History',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.view_all': 'View All',
    'common.show_more': 'Show More',
    'common.show_less': 'Show Less',
    
    // Account Types
    'account.user': 'User',
    'account.admin': 'Admin',
    'account.super_admin': 'Super Admin',
    'account.verified': 'Verified',
    
    // Profile Tabs
    'profile.tabs.memories': 'Memories',
    'profile.tabs.followers': 'Followers',
    'profile.tabs.following': 'Following',
    'profile.tabs.albums': 'Albums',
    'profile.back': 'Back',
    
    // Gift Rarities
    'gifts.rarity.common': 'Common',
    'gifts.rarity.rare': 'Rare',
    'gifts.rarity.epic': 'Epic',
    'gifts.rarity.legendary': 'Legendary',
    
    // Memory Types
    'memory.flash': 'Flash',
    'memory.trending': 'Trending',
    'memory.star': 'Star',
    'memory.legend': 'Legend',
    'memory.permanent': 'Permanent',
    'memory.create': 'Create Memory',
    'memory.upload': 'Upload',
    'memory.camera': 'Camera',
    'memory.gallery': 'Gallery',
    'memory.no_content': 'No Content',
    'memory.expired': 'Expired',
    
    // Chat & Communication
    'chat.online': 'Online',
    'chat.offline': 'Offline',
    'chat.typing': 'Typing...',
    'chat.send_message': 'Send Message',
    'chat.message_sent': 'Message Sent',
    'chat.no_messages': 'No Messages',
    'chat.start_conversation': 'Start Conversation',
    'chat.private_room': 'Private Room',
    'chat.group_room': 'Group Room',
    
    // Buttons & Actions
    'buttons.follow': 'Follow',
    'buttons.unfollow': 'Unfollow',
    'buttons.message': 'Message',
    'buttons.call': 'Call',
    'buttons.video_call': 'Video Call',
    'buttons.share': 'Share',
    'buttons.like': 'Like',
    'buttons.comment': 'Comment',
    'buttons.report': 'Report',
    'buttons.block': 'Block',
    'buttons.add_friend': 'Add Friend',
    'buttons.remove_friend': 'Remove Friend',
    
    // Status & States
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.away': 'Away',
    'status.busy': 'Busy',
    'status.invisible': 'Invisible',
    'status.last_seen': 'Last Seen',
    'status.active_now': 'Active Now',
    
    // Time & Dates
    'time.now': 'Now',
    'time.minute_ago': '1 minute ago',
    'time.minutes_ago': 'minutes ago',
    'time.hour_ago': '1 hour ago',
    'time.hours_ago': 'hours ago',
    'time.day_ago': '1 day ago',
    'time.days_ago': 'days ago',
    'time.week_ago': '1 week ago',
    'time.weeks_ago': 'weeks ago',
    'time.month_ago': '1 month ago',
    'time.months_ago': 'months ago',
    
    // Error Messages
    'error.network': 'Network Error',
    'error.server': 'Server Error',
    'error.not_found': 'Not Found',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Forbidden',
    'error.invalid_data': 'Invalid Data',
    'error.file_too_large': 'File Too Large',
    'error.unsupported_format': 'Unsupported Format',
    
    // Success Messages
    'success.saved': 'Saved',
    'success.updated': 'Updated',
    'success.deleted': 'Deleted',
    'success.uploaded': 'Uploaded',
    'success.sent': 'Sent',
    'success.received': 'Received',
    
    // Loading States
    'loading.please_wait': 'Please wait...',
    'loading.uploading': 'Uploading...',
    'loading.downloading': 'Downloading...',
    'loading.processing': 'Processing...',
    'loading.connecting': 'Connecting...',
    
    // Gift Actions (Additional)
    'gifts.no_gifts': 'No gifts available right now',
    'gifts.try_later': 'Please try again later',
    'gifts.loading': 'Loading gifts...',
    'gifts.error_loading': 'Error loading gifts',
    'gifts.retry': 'Try Again',
    
    // Authentication Pages
    'auth.register': 'Sign Up',
    'auth.login': 'Sign In',
    'auth.forgot_password': 'Forgot Password',
    'auth.back_to_login': 'Back to Login',
    'auth.first_name': 'First Name',
    'auth.last_name': 'Last Name',
    'auth.username': 'Username',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.country': 'Country',
    'auth.select_country': 'Select your country',
    'auth.creating_account': 'Creating account...',
    'auth.logging_in': 'Signing in...',
    'auth.sending_reset': 'Sending...',
    'auth.send_reset_link': 'Send Reset Link',
    'auth.already_have_account': 'Already have an account?',
    'auth.dont_have_account': 'Don\'t have an account?',
    'auth.register_now': 'Sign up now',
    'auth.sign_in_here': 'Sign in here',
    'auth.username_available': 'Username is available',
    'auth.username_taken': 'Username is already taken',
    'auth.checking_username': 'Checking...',
    'auth.registration_error': 'An error occurred while creating account',
    'auth.reset_error': 'An error occurred while sending reset link',
    'auth.success_title': 'Success',
    'auth.error_title': 'Error',
    'auth.reset_password_error': 'An error occurred while setting the password',
    'auth.create_new_account': 'Create New Account',
    'auth.join_community': 'Join the LaaBoBo Live community',
    
    // Account & Profile Additional
    'account.image_updated': 'Image Updated',
    'account.image_updated_success': 'Your profile picture has been updated successfully',
    'account.upload_failed': 'Failed to upload image. Please try again.',
    
    // Upload
    'upload.file_too_large': 'File Too Large',
    'upload.image_size_limit': 'Maximum image size is 5MB',

    // Navigation Additional
    'nav.start_stream': 'Start Stream',
    'nav.back': 'Back',

    // Stream/Chat Additional
    'stream.create_new_chat': 'Create New Chat',
    'stream.quick_chat': 'New Quick Chat',
    'stream.text_only': 'Live Text Chat',
    'stream.quick_category': 'Quick Chat',
    'stream.creation_failed': 'Failed to create chat',
    'stream.login_required': 'You must log in first',
    'stream.no_permission': 'You do not have permission to create a chat',
    'stream.title_placeholder': 'Enter chat title',
    'stream.description_placeholder': 'Brief description of the chat',
    'stream.creating': 'Creating...',
    'stream.create_button': 'Create Chat',
    'stream.text_only_desc': 'Text chat only',
    'stream.participants_can_join': 'Users can join and send text messages',
    'stream.chat_details': 'Chat Details',
    'stream.chat_title': 'Chat Title',
    'stream.chat_description': 'Chat Description',

    // Validation
    'validation.title_required': 'Please enter a chat title',

    // Profile Additional
    'profile.laaboboo_user': 'LaaBoBo User',
    'profile.user_points': 'Points',
    'profile.user_followers': 'Followers',
    'profile.user_likes': 'Likes',
    'profile.user_comments': 'Comments',
    'profile.user_shares': 'Shares',
    'profile.user_gifts': 'Gifts',
    'profile.protected_albums': 'Protected Albums',
    'profile.view_albums': 'View Albums',
    'profile.create_album': 'Create Album',
    'profile.no_locked_albums': 'No protected albums',
    'profile.create_first_album': 'Create your first protected album',
    'profile.my_content': 'My Content',
    'profile.user_memories': 'Memories',
    'profile.user_videos': 'Videos',
    'profile.account_settings': 'Settings',
    'profile.user_wallet': 'Wallet',
    'profile.platform_policies': 'Policies',
    'profile.logout_action': 'Logout',
    'profile.albums_count': 'You have {count} protected albums',
    'memory.type_short': 'Memory',
    'common.user': 'User',

    // Authentication Additional
    'auth.login_required': 'Please log in',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(() => {
    // Get saved language from localStorage or default to Arabic
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      return languages.find(lang => lang.code === savedLanguage) || languages[0];
    }
    return languages[0]; // Default to Arabic
  });

  const setLanguage = (language: LanguageOption) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language.code);
    
    // Update document direction
    document.documentElement.dir = language.direction;
    document.documentElement.lang = language.code;
  };

  const t = (key: string): string => {
    return (translations[currentLanguage.code] as any)[key] || key;
  };

  // Set initial direction on mount
  useEffect(() => {
    document.documentElement.dir = currentLanguage.direction;
    document.documentElement.lang = currentLanguage.code;
  }, [currentLanguage]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isRTL: currentLanguage.direction === 'rtl',
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Provide fallback values if context is not available
    return {
      currentLanguage: languages[0], // Default to Arabic
      setLanguage: () => {},
      isRTL: true,
      t: (key: string) => key, // Return key as fallback
    };
  }
  return context;
}