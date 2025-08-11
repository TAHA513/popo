import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import LastSeenToggle from "@/components/last-seen-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, CreditCard, UserPlus, Camera, Upload, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AccountPage() {
  const { user } = useAuth();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { currentLanguage, setLanguage, t, isRTL } = useLanguage();

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      return apiRequest('/api/user/profile-image', 'POST', formData);
    },
    onSuccess: () => {
      toast({
        title: t('account.image_updated'),
        description: t('account.image_updated_success'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: t('auth.error_title'),
        description: t('account.upload_failed'),
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: t('upload.file_too_large'),
          description: t('upload.image_size_limit'),
          variant: "destructive",
        });
        return;
      }
      uploadProfileImageMutation.mutate(file);
    }
  };

  if (!user) {
    // Account creation form for non-logged users
    return (
      <div className="min-h-screen bg-gradient-to-br from-laa-pink/10 via-laa-purple/10 to-laa-blue/10 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🐰</span>
            </div>
            <CardTitle className="text-2xl">{t('auth.create_new_account')}</CardTitle>
            <CardDescription>{t('auth.join_community')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.username')}</Label>
              <Input id="username" placeholder="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full gradient-bg text-white" onClick={() => window.location.href = '/api/login'}>
              <UserPlus className="w-4 h-4 mr-2" />
              إنشاء حساب
            </Button>
            <div className="text-center">
              <Button variant="link" onClick={() => window.location.href = '/api/login'}>
                لديك حساب بالفعل؟ تسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Account management for logged users
  return (
    <div className={`min-h-screen bg-gradient-to-br from-laa-pink/10 via-laa-purple/10 to-laa-blue/10 dark:from-gray-900 dark:to-gray-800 p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            {isRTL ? 'إدارة الحساب' : 'Account Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL ? 'قم بإدارة معلومات حسابك وإعداداتك' : 'Manage your account information and settings'}
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              {isRTL ? 'الملف الشخصي' : 'Profile'}
            </TabsTrigger>
            <TabsTrigger value="wallet">
              {isRTL ? 'المحفظة' : 'Wallet'}
            </TabsTrigger>
            <TabsTrigger value="settings">
              {isRTL ? 'الإعدادات' : 'Settings'}
            </TabsTrigger>
            <TabsTrigger value="security">
              {isRTL ? 'الأمان' : 'Security'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {isRTL ? 'المعلومات الشخصية' : 'Personal Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image Section */}
                <div className="flex items-center space-x-6 rtl:space-x-reverse">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                      {user.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt={user.username || "الصورة الشخصية"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parentDiv = e.currentTarget.parentElement;
                            if (parentDiv) {
                              parentDiv.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{user.username}</h3>
                    <p className="text-sm text-gray-500">{t('profile.click_camera')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('profile.first_name')}</Label>
                    <Input 
                      id="firstName" 
                      defaultValue={user.firstName || ''} 
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('profile.last_name')}</Label>
                    <Input 
                      id="lastName" 
                      defaultValue={user.lastName || ''} 
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('profile.email')}</Label>
                    <Input 
                      id="email" 
                      defaultValue={user.email || ''} 
                      disabled 
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('profile.account_type')}</Label>
                    <Badge variant="secondary" className="w-fit">
                      {user.role === 'super_admin' ? (isRTL ? 'مدير عام' : 'Super Admin') : user.role === 'admin' ? (isRTL ? 'مدير' : 'Admin') : (isRTL ? 'مستخدم' : 'User')}
                    </Badge>
                  </div>
                </div>
                <Button className="gradient-bg text-white">
                  {t('profile.save_changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('wallet.digital_wallet')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-r from-laa-pink to-laa-purple rounded-lg text-white">
                    <div className="text-3xl font-bold">{user.points || 0}</div>
                    <div className="text-sm opacity-90">{t('wallet.current_points')}</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-laa-purple to-laa-blue rounded-lg text-white">
                    <div className="text-3xl font-bold">{user.totalEarnings || 0}</div>
                    <div className="text-sm opacity-90">{t('wallet.total_earnings')}</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-laa-blue to-laa-pink rounded-lg text-white">
                    <div className="text-3xl font-bold">0</div>
                    <div className="text-sm opacity-90">{t('wallet.gifts_sent')}</div>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <Button className="w-full gradient-bg text-white">
                    {t('wallet.buy_points')}
                  </Button>
                  <Button variant="outline" className="w-full">
                    {t('wallet.withdraw')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.app_settings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language Setting */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <Label className="font-medium">{t('settings.language')}</Label>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.language_desc')}
                    </p>
                  </div>
                  <div className="w-48">
                    <Select
                      value={currentLanguage.code}
                      onValueChange={(value) => {
                        const selectedLang = languages.find(lang => lang.code === value);
                        if (selectedLang) {
                          setLanguage(selectedLang);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <span>{currentLanguage.flag}</span>
                            <span>{currentLanguage.localName}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <div className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.localName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('settings.notifications')}</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.notifications_desc')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">{t('settings.enable')}</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('settings.privacy')}</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.privacy_desc')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">{t('settings.manage')}</Button>
                </div>
                
                <div className="border-t pt-4">
                  <LastSeenToggle />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('security.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('security.current_password')}</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    placeholder="••••••••"
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('security.new_password')}</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    placeholder="••••••••"
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <Button className="gradient-bg text-white">
                  {t('security.update_password')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}