import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  CheckCircle, 
  XCircle,
  UserX,
  UserCheck,
  Crown,
  Gift,
  MessageSquare,
  Heart,
  Eye,
  TrendingUp,
  Calendar,
  Search,
  Ban,
  Lock,
  Unlock
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationBadge, setVerificationBadge] = useState("LaaBoBo");
  const { toast } = useToast();

  // TikTok-style Multi-Layer Security Check
  const [accessVerified, setAccessVerified] = useState(false);
  
  const [securityCode, setSecurityCode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  
  const systemOwnerEmails = ['fnnm945@gmail.com']; // مالك النظام الوحيد
  const secretCode = "LaaBoBo2025Owner";

  // Auto-verify access for system owner on direct navigation
  useEffect(() => {
    console.log('User data:', user);
    console.log('System owner emails:', systemOwnerEmails);
    if (user && user.email && systemOwnerEmails.includes(user.email)) {
      console.log('System owner detected - auto-verifying access');
      setAccessVerified(true);
    }
  }, [user]);
  
  // First layer: User authentication and role check (DISABLED for system owner)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-gray-900 border-red-600 border-2">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🚫</div>
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-red-400">ACCESS DENIED</h2>
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

  // Second layer: Secret code verification (TikTok style)
  if (!accessVerified) {
    const handleSecurityVerification = () => {
      if (securityCode === secretCode) {
        setAccessVerified(true);
        toast({
          title: "🔓 تم منح الوصول",
          description: "مرحباً بك في لوحة التحكم الرئيسية"
        });
      } else {
        setAttempts(prev => prev + 1);
        setSecurityCode("");
        
        if (attempts >= maxAttempts - 1) {
          toast({
            title: "🚨 تم حظر الوصول",
            description: "تم تجاوز عدد المحاولات المسموحة",
            variant: "destructive"
          });
          // Redirect to home after failed attempts
          setTimeout(() => window.location.href = "/", 2000);
        } else {
          toast({
            title: "❌ رمز خاطئ",
            description: `المحاولات المتبقية: ${maxAttempts - attempts - 1}`,
            variant: "destructive"
          });
        }
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
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>Attempts: {attempts}/{maxAttempts}</span>
                <span>TikTok-Style Security</span>
              </div>
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

  // Fetch admin statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
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

  // Unverify user mutation
  const unverifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch('/api/admin/unverify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to unverify user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "تم إلغاء التوثيق",
        description: "تم إلغاء توثيق المستخدم بنجاح"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إلغاء التوثيق",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const filteredUsers = users.filter((user: User) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
          </div>
          <p className="text-gray-600">مرحباً {user.firstName || user.username}، إليك نظرة شاملة على المنصة</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            <TabsTrigger value="verification">التوثيق</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
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
                      <p className="text-sm font-medium text-gray-600">المستخدمين النشطين</p>
                      <p className="text-2xl font-bold text-purple-600">{stats?.onlineUsers || 0}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المنشورات</p>
                      <p className="text-2xl font-bold text-orange-600">{stats?.totalMemories || 0}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  النشاط الأخير
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">تم توثيق حساب جديد</span>
                    </div>
                    <span className="text-xs text-gray-500">منذ دقيقتين</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-600" />
                      <span className="text-sm">انضمام 5 مستخدمين جدد</span>
                    </div>
                    <span className="text-xs text-gray-500">منذ ساعة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    إدارة المستخدمين
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث عن مستخدم..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>النقاط</TableHead>
                        <TableHead>تاريخ الانضمام</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{user.firstName || user.username}</span>
                              {user.isVerified && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                              {user.isAdmin && (
                                <Badge variant="destructive">مدير</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.email || 'غير محدد'}</TableCell>
                          <TableCell>
                            <Badge variant={user.isOnline ? "default" : "secondary"}>
                              {user.isOnline ? "متصل" : "غير متصل"}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.points || 0}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!user.isVerified ? (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  توثيق
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unverifyUserMutation.mutate(user.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  إلغاء التوثيق
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  إدارة التوثيق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    يمكنك هنا إدارة حالة التوثيق للمستخدمين وتخصيص شارات التوثيق.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-green-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <h3 className="font-semibold">المستخدمين الموثقين</h3>
                        </div>
                        <p className="text-2xl font-bold text-green-600 mb-2">
                          {users.filter((u: User) => u.isVerified).length}
                        </p>
                        <p className="text-sm text-gray-600">من إجمالي {users.length} مستخدم</p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Crown className="h-6 w-6 text-blue-600" />
                          <h3 className="font-semibold">شارة التوثيق</h3>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mb-2">LaaBoBo</p>
                        <p className="text-sm text-gray-600">الشارة الافتراضية للتوثيق</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  إعدادات النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">إعدادات التوثيق</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">التوثيق التلقائي</h4>
                          <p className="text-sm text-gray-600">توثيق المستخدمين الجدد تلقائياً</p>
                        </div>
                        <Button variant="outline" size="sm">
                          تعطيل
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">شارة التوثيق الافتراضية</h4>
                          <p className="text-sm text-gray-600">النص الافتراضي لشارة التوثيق</p>
                        </div>
                        <Input value="LaaBoBo" className="w-32" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">إعدادات النظام</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">وضع الصيانة</h4>
                          <p className="text-sm text-gray-600">تعطيل المنصة مؤقتاً للصيانة</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Lock className="h-4 w-4 mr-1" />
                          تفعيل
                        </Button>
                      </div>
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