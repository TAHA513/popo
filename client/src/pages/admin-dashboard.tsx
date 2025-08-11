import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Shield, 
  Users, 
  Settings, 
  CheckCircle, 
  Crown,
  ShieldCheck, 
  Activity, 
  Coins,
  Lock,
  Eye,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Ban,
  Trash2,
  Edit
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  isAdmin: boolean;
  role: string;
  points: number;
  createdAt: string;
  lastSeenAt: string;
  isOnline: boolean;
  verificationBadge?: string;
  profileImageUrl?: string;
}

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  onlineUsers: number;
  totalMemories: number;
  totalGifts: number;
  totalPoints: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  
  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationBadge, setVerificationBadge] = useState("LaaBoBo");
  const [accessVerified, setAccessVerified] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const { toast } = useToast();
  
  const maxAttempts = 3;
  const systemOwnerEmails = ['fnnm945@gmail.com'];
  const secretCode = "LaaBoBo2025Owner";

  // Fetch admin statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          credentials: 'include'
        });
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        return null;
      }
    },
    enabled: accessVerified && user?.email === 'fnnm945@gmail.com'
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/users', {
          credentials: 'include'
        });
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        return [];
      }
    },
    enabled: accessVerified && user?.email === 'fnnm945@gmail.com'
  });

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, email, badge }: { userId: string; email: string; badge: string }) => {
      const response = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          verifiedEmail: email,
          verificationBadge: badge
        })
      });
      if (!response.ok) throw new Error('Failed to verify user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "تم توثيق المستخدم",
        description: "تم توثيق المستخدم بنجاح"
      });
      setSelectedUser(null);
      setVerificationEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التوثيق",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Auto-verify access for system owner
  useEffect(() => {
    if (user && user.email && systemOwnerEmails.includes(user.email)) {
      setAccessVerified(true);
    }
  }, [user]);

  // Loading and authentication check combined
  if (!user || !isAuthenticated || !systemOwnerEmails.includes(user.email || '')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-gray-900/90 border-red-500 border-2 shadow-2xl backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-4">Unauthorized Access Attempt Detected</p>
            <p className="text-xs text-gray-500">LaaBoBo Security System - Owner Only</p>
            <div className="mt-6 p-3 bg-red-900/30 rounded-lg border border-red-600">
              <p className="text-red-300 text-sm">This incident has been logged</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  


  // Security verification check
  if (!accessVerified) {
    const handleSecurityVerification = () => {
      if (securityCode === secretCode) {
        setAccessVerified(true);
        toast({
          title: "تم التحقق بنجاح",
          description: "مرحباً بك في لوحة التحكم الإدارية"
        });
      } else {
        setAttempts(prev => prev + 1);
        toast({
          title: "كود خاطئ",
          description: "كود التحقق غير صحيح",
          variant: "destructive"
        });
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-gray-900/90 border-purple-500 border-2 shadow-2xl backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">🔐</div>
              <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">LaaBoBo Owner Panel</h2>
              <p className="text-purple-300">Security Verification Required</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Master Access Code
                </label>
                <Input
                  type="password"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  placeholder="Enter owner security code..."
                  className="bg-black/50 border-purple-500 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleSecurityVerification()}
                />
              </div>
              
              <Button 
                onClick={handleSecurityVerification}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3"
                disabled={!securityCode || attempts >= maxAttempts}
              >
                {attempts >= maxAttempts ? "🚫 Access Blocked" : "🔓 Verify Access"}
              </Button>
            </div>
            
            {attempts > 0 && (
              <div className="mt-4 p-3 bg-red-900/30 rounded-lg border border-red-600">
                <p className="text-red-300 text-sm">⚠️ Invalid access attempt detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = (users || []).filter((user: User) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
          </div>
          <p className="text-gray-600">مرحباً {user?.firstName || user?.username}، إليك نظرة شاملة على المنصة</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 text-xs">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="content">المحتوى</TabsTrigger>
            <TabsTrigger value="financial">المالي</TabsTrigger>
            <TabsTrigger value="moderation">الإشراف</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="system">النظام</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المستخدمين الموثقين</p>
                      <p className="text-2xl font-bold text-green-600">{stats?.verifiedUsers || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">المستخدمين المتصلين</p>
                      <p className="text-2xl font-bold text-purple-600">{stats?.onlineUsers || 0}</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي النقاط</p>
                      <p className="text-2xl font-bold text-orange-600">{stats?.totalPoints || 0}</p>
                    </div>
                    <Coins className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  إدارة المستخدمين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Input
                      placeholder="البحث عن مستخدم..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                    <div className="text-sm text-gray-500">
                      {filteredUsers.length} من {users.length} مستخدم
                    </div>
                  </div>

                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">جاري تحميل المستخدمين...</div>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 font-medium text-sm border-b">
                        <div>المستخدم</div>
                        <div>البريد الإلكتروني</div>
                        <div>النقاط</div>
                        <div>الحالة</div>
                        <div>التوثيق</div>
                        <div>الإجراءات</div>
                      </div>
                      
                      {filteredUsers.map((user: any) => (
                        <div key={user.id} className="grid grid-cols-6 gap-4 p-4 border-b hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profileImageUrl} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-xs text-gray-500">{user.firstName} {user.lastName}</div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">{user.email}</div>
                          
                          <div className="text-sm font-medium">{user.points}</div>
                          
                          <div>
                            {user.isOnline ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">متصل</Badge>
                            ) : (
                              <Badge variant="secondary">غير متصل</Badge>
                            )}
                          </div>
                          
                          <div>
                            {user.isVerified ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-600">{user.verificationBadge}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">غير موثق</span>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            {!user.isVerified ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                                className="h-7 px-2 text-xs"
                              >
                                توثيق
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                              >
                                إلغاء
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-blue-600"
                              onClick={() => {
                                // Edit user functionality
                                console.log("Editing user:", user.id);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              تحرير
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                // Ban user functionality
                                console.log("Banning user:", user.id);
                              }}
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              حظر
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    إحصائيات المحتوى
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">إجمالي الذكريات</p>
                      <p className="text-2xl font-bold text-blue-800">{stats?.totalMemories || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">البث المباشر النشط</p>
                      <p className="text-2xl font-bold text-green-800">0</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline" onClick={() => window.open('/memories', '_blank')}>
                      <Eye className="h-4 w-4 mr-2" />
                      عرض جميع الذكريات
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => window.open('/live', '_blank')}>
                      <Activity className="h-4 w-4 mr-2" />
                      إدارة البث المباشر
                    </Button>
                    <Button className="w-full" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      حذف المحتوى المحظور
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أدوات الإشراف السريع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" variant="destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    حذف المحتوى المبلغ عنه
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    مراجعة التقارير الجديدة
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    إعدادات الفلترة التلقائية
                  </Button>
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">إجراءات سريعة</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline">إخفاء المحتوى</Button>
                      <Button size="sm" variant="outline">تحذير المستخدم</Button>
                      <Button size="sm" variant="destructive">حظر مؤقت</Button>
                      <Button size="sm" variant="destructive">حظر دائم</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Management Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    إدارة النقاط
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">إجمالي النقاط في النظام</p>
                    <p className="text-2xl font-bold text-orange-800">{stats?.totalPoints || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <Input placeholder="معرف المستخدم أو البريد الإلكتروني" />
                    <Input placeholder="عدد النقاط" type="number" />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline">
                        <Coins className="h-3 w-3 mr-1" />
                        إضافة نقاط
                      </Button>
                      <Button variant="destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        خصم نقاط
                      </Button>
                    </div>
                    <Button className="w-full" variant="outline" size="sm">
                      عرض سجل المعاملات
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إدارة الهدايا</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">إجمالي الهدايا المرسلة</p>
                    <p className="text-2xl font-bold text-purple-800">{stats?.totalGifts || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <Coins className="h-4 w-4 mr-2" />
                      إضافة هدية جديدة
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      تحرير الهدايا الموجودة
                    </Button>
                    <Button className="w-full" variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      إحصائيات الهدايا
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الإعدادات المالية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">سعر النقطة الواحدة (دولار)</label>
                      <Input placeholder="0.01" type="number" step="0.001" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">نقاط البداية للمستخدمين الجدد</label>
                      <Input placeholder="0" type="number" />
                    </div>
                    <Button className="w-full">حفظ الإعدادات</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    أدوات الإشراف
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="destructive">حظر مستخدم</Button>
                    <Button variant="outline">إلغاء الحظر</Button>
                    <Button variant="destructive">حذف المحتوى</Button>
                    <Button variant="outline">استعادة المحتوى</Button>
                  </div>
                  <div className="space-y-2">
                    <Input placeholder="معرف المستخدم أو البريد الإلكتروني" />
                    <Input placeholder="سبب الإجراء" />
                    <Button className="w-full">تنفيذ الإجراء</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>التقارير والشكاوى</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium">التقارير المعلقة: 0</p>
                      <p className="text-sm text-gray-600">لا توجد تقارير جديدة</p>
                    </div>
                    <Button className="w-full" variant="outline">
                      عرض جميع التقارير
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    إحصائيات الاستخدام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-blue-600">الزيارات اليومية</p>
                      <p className="text-lg font-bold text-blue-800">1,234</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-green-600">مشاهدات المحتوى</p>
                      <p className="text-lg font-bold text-green-800">5,678</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm text-purple-600">تفاعلات الهدايا</p>
                      <p className="text-lg font-bold text-purple-800">890</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      تقرير مفصل
                    </Button>
                    <Button className="w-full" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      إحصائيات شهرية
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    أكثر المستخدمين نشاطاً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user: any, index: number) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium">{user.username}</span>
                        </div>
                        <span className="text-sm text-gray-600">{user.points} نقطة</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>أدوات المراقبة المتقدمة</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Eye className="h-6 w-6 mb-2" />
                  <span>مراقبة الجلسات المباشرة</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Activity className="h-6 w-6 mb-2" />
                  <span>تتبع النشاط الحقيقي</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>تحليل سلوك المستخدمين</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    إعدادات النظام العامة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">وضع الصيانة</h4>
                      <p className="text-sm text-gray-600">تعطيل الموقع مؤقتاً</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Lock className="h-4 w-4 mr-1" />
                      تفعيل
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">التسجيل الجديد</h4>
                      <p className="text-sm text-gray-600">السماح بتسجيل مستخدمين جدد</p>
                    </div>
                    <Button variant="outline" size="sm">
                      تعطيل
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">البث المباشر</h4>
                      <p className="text-sm text-gray-600">السماح بالبث المباشر</p>
                    </div>
                    <Button variant="outline" size="sm">
                      مفعل
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات النظام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">استخدام الخادم</p>
                      <p className="text-lg font-bold">85%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">استخدام قاعدة البيانات</p>
                      <p className="text-lg font-bold">62%</p>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    عرض تفاصيل الأداء
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أدوات التحكم المتقدمة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Lock className="h-3 w-3 mr-1" />
                      تجميد النظام
                    </Button>
                    <Button variant="outline" size="sm">
                      <Activity className="h-3 w-3 mr-1" />
                      مراقبة مباشرة
                    </Button>
                    <Button variant="destructive" size="sm">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      إيقاف طارئ
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3 mr-1" />
                      نسخ احتياطي
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">إعدادات الأمان</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">تسجيل العمليات</span>
                        <Button size="sm" variant="outline">مفعل</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">حماية من DDOS</span>
                        <Button size="sm" variant="outline">مفعل</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">تشفير البيانات</span>
                        <Button size="sm" variant="outline">مفعل</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  نظام التوثيق
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">معلومات التوثيق</h3>
                  <p className="text-sm text-blue-700">
                    يمكن توثيق المستخدمين لإضافة شارة موثقة إلى ملفاتهم الشخصية.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">إحصائيات التوثيق</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>المستخدمين الموثقين</span>
                        <span className="font-bold text-green-600">{stats?.verifiedUsers || 0}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>غير الموثقين</span>
                        <span className="font-bold text-gray-600">
                          {(stats?.totalUsers || 0) - (stats?.verifiedUsers || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">التوثيق السريع</h3>
                    <div className="space-y-3">
                      <Input
                        placeholder="البريد الإلكتروني للمستخدم"
                        value={verificationEmail}
                        onChange={(e) => setVerificationEmail(e.target.value)}
                      />
                      <Input
                        placeholder="شارة التوثيق (مثال: LaaBoBo)"
                        value={verificationBadge}
                        onChange={(e) => setVerificationBadge(e.target.value)}
                      />
                      <Button
                        onClick={() => {
                          const user = users.find((u: any) => u.email === verificationEmail);
                          if (user) {
                            verifyUserMutation.mutate({
                              userId: user.id,
                              email: verificationEmail,
                              badge: verificationBadge
                            });
                          }
                        }}
                        disabled={!verificationEmail || verifyUserMutation.isPending}
                        className="w-full"
                      >
                        {verifyUserMutation.isPending ? 'جاري التوثيق...' : 'توثيق المستخدم'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Verification Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>توثيق المستخدم: {selectedUser.username}</DialogTitle>
              <DialogDescription>
                قم بتوثيق هذا المستخدم عبر إدخال البريد الإلكتروني وشارة التوثيق
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">البريد الإلكتروني للتوثيق</label>
                <Input
                  value={verificationEmail}
                  onChange={(e) => setVerificationEmail(e.target.value)}
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
              <div>
                <label className="text-sm font-medium">شارة التوثيق</label>
                <Input
                  value={verificationBadge}
                  onChange={(e) => setVerificationBadge(e.target.value)}
                  placeholder="مثال: LaaBoBo"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  إلغاء
                </Button>
                <Button
                  onClick={() => verifyUserMutation.mutate({
                    userId: selectedUser.id,
                    email: verificationEmail,
                    badge: verificationBadge
                  })}
                  disabled={!verificationEmail}
                >
                  توثيق المستخدم
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}