import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import LastSeenToggle from "@/components/last-seen-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, CreditCard, UserPlus, Camera, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from "@/lib/i18n";

export default function AccountPage() {
  const { user } = useAuth();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      return apiRequest('/api/user/profile-image', 'POST', formData);
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الصورة",
        description: "تم تحديث صورتك الشخصية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "الملف كبير جداً",
          description: "الحد الأقصى لحجم الصورة هو 5 ميجابايت",
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
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>انضم إلى مجتمع LaaBoBo Live</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
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
    <div className="min-h-screen bg-gradient-to-br from-laa-pink/10 via-laa-purple/10 to-laa-blue/10 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">إدارة الحساب</h1>
          <p className="text-gray-600 dark:text-gray-400">قم بإدارة معلومات حسابك وإعداداتك</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="wallet">المحفظة</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            <TabsTrigger value="security">الأمان</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  المعلومات الشخصية
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
                          alt={user.username} 
                          className="w-full h-full object-cover"
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
                    <p className="text-sm text-gray-500">انقر على الكاميرا لتغيير الصورة</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">الاسم الأول</Label>
                    <Input 
                      id="firstName" 
                      defaultValue={user.firstName || ''} 
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">الاسم الأخير</Label>
                    <Input 
                      id="lastName" 
                      defaultValue={user.lastName || ''} 
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input 
                      id="email" 
                      defaultValue={user.email || ''} 
                      disabled 
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع الحساب</Label>
                    <Badge variant="secondary" className="w-fit">
                      {user.role === 'super_admin' ? 'مدير عام' : user.role === 'admin' ? 'مدير' : 'مستخدم'}
                    </Badge>
                  </div>
                </div>
                <Button className="gradient-bg text-white">
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  المحفظة الرقمية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-r from-laa-pink to-laa-purple rounded-lg text-white">
                    <div className="text-3xl font-bold">{user.points || 0}</div>
                    <div className="text-sm opacity-90">النقاط الحالية</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-laa-purple to-laa-blue rounded-lg text-white">
                    <div className="text-3xl font-bold">{user.totalEarnings || 0}</div>
                    <div className="text-sm opacity-90">إجمالي الأرباح</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-laa-blue to-laa-pink rounded-lg text-white">
                    <div className="text-3xl font-bold">0</div>
                    <div className="text-sm opacity-90">الهدايا المرسلة</div>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <Button className="w-full gradient-bg text-white">
                    شراء نقاط
                  </Button>
                  <Button variant="outline" className="w-full">
                    سحب الأرباح
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات التطبيق</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>الإشعارات</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">تلقي إشعارات الهدايا والرسائل</p>
                  </div>
                  <Button variant="outline" size="sm">تفعيل</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>الخصوصية</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">إدارة إعدادات الخصوصية</p>
                  </div>
                  <Button variant="outline" size="sm">إدارة</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('common.settings')} - اللغة</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">تغيير لغة واجهة التطبيق</p>
                  </div>
                  <LanguageToggle />
                </div>
                
                <div className="col-span-full">
                  <LastSeenToggle />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الأمان والحماية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    placeholder="••••••••"
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    placeholder="••••••••"
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <Button className="gradient-bg text-white">
                  تحديث كلمة المرور
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}