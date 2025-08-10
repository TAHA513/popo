import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Shield, 
  Eye, 
  Lock, 
  Globe, 
  Users, 
  MessageCircle, 
  Gift,
  Share2,
  Settings
} from "lucide-react";

interface PrivacySettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: {
    isPrivateAccount: boolean;
    visibilityLevel: 'public' | 'followers' | 'private';
    allowComments: boolean;
    allowSharing: boolean;
    allowGifts: boolean;
    allowDirectMessages: boolean;
    allowGiftsFromStrangers: boolean;
  };
  onSave: (settings: any) => void;
}

export default function PrivacySettings({ 
  isOpen, 
  onOpenChange, 
  settings, 
  onSave 
}: PrivacySettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>إعدادات الخصوصية والأمان</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            إعدادات الخصوصية والأمان للحساب
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2 rtl:space-x-reverse">
                <Lock className="w-5 h-5" />
                <span>خصوصية الحساب</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>حساب خاص</Label>
                  <p className="text-sm text-gray-600">
                    عندما يكون حسابك خاصاً، يجب أن يطلب الأشخاص متابعتك لرؤية ذكرياتك
                  </p>
                </div>
                <Switch
                  checked={localSettings.isPrivateAccount}
                  onCheckedChange={(checked) => updateSetting('isPrivateAccount', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>من يمكنه رؤية ذكرياتك بشكل افتراضي</Label>
                <Select
                  value={localSettings.visibilityLevel}
                  onValueChange={(value) => updateSetting('visibilityLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Globe className="w-4 h-4" />
                        <span>الجميع (عام)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="followers">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Users className="w-4 h-4" />
                        <span>المتابعون فقط</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Lock className="w-4 h-4" />
                        <span>أنا فقط (خاص)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Interaction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2 rtl:space-x-reverse">
                <MessageCircle className="w-5 h-5" />
                <span>التفاعل مع المحتوى</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>السماح بالتعليقات</Label>
                  <p className="text-sm text-gray-600">
                    يمكن للآخرين التعليق على ذكرياتك
                  </p>
                </div>
                <Switch
                  checked={localSettings.allowComments}
                  onCheckedChange={(checked) => updateSetting('allowComments', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>السماح بالمشاركة</Label>
                  <p className="text-sm text-gray-600">
                    يمكن للآخرين مشاركة ذكرياتك
                  </p>
                </div>
                <Switch
                  checked={localSettings.allowSharing}
                  onCheckedChange={(checked) => updateSetting('allowSharing', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>السماح بالهدايا</Label>
                  <p className="text-sm text-gray-600">
                    يمكن للآخرين إرسال هدايا لذكرياتك
                  </p>
                </div>
                <Switch
                  checked={localSettings.allowGifts}
                  onCheckedChange={(checked) => updateSetting('allowGifts', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Messages and Gifts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2 rtl:space-x-reverse">
                <Gift className="w-5 h-5" />
                <span>الرسائل والهدايا</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>السماح بالرسائل المباشرة</Label>
                  <p className="text-sm text-gray-600">
                    يمكن للآخرين إرسال رسائل مباشرة لك
                  </p>
                </div>
                <Switch
                  checked={localSettings.allowDirectMessages}
                  onCheckedChange={(checked) => updateSetting('allowDirectMessages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>هدايا من الغرباء</Label>
                  <p className="text-sm text-gray-600">
                    يمكن لغير المتابعين إرسال هدايا لك
                  </p>
                </div>
                <Switch
                  checked={localSettings.allowGiftsFromStrangers}
                  onCheckedChange={(checked) => updateSetting('allowGiftsFromStrangers', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3 rtl:space-x-reverse">
            <Button onClick={handleSave} className="flex-1">
              حفظ الإعدادات
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}