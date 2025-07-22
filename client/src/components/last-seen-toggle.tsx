import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  Clock, 
  Users, 
  Shield,
  Zap
} from "lucide-react";

export default function LastSeenToggle() {
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
          <Eye className="w-6 h-6 text-purple-600" />
          إعدادات آخر ظهور
        </CardTitle>
        <p className="text-gray-600">تحكم في مشاركة معلومات نشاطك مع الآخرين</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Last Seen Setting */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <Label className="text-base font-semibold text-gray-800">
                آخر ظهور
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                السماح للأصدقاء برؤية وقت آخر نشاط لك
              </p>
              <Badge variant="outline" className="mt-2 bg-white/50">
                {showLastSeen ? 'مفعل' : 'معطل'}
              </Badge>
            </div>
          </div>
          <Switch
            checked={showLastSeen}
            onCheckedChange={setShowLastSeen}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        {/* Online Status Setting */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Label className="text-base font-semibold text-gray-800">
                الحالة المباشرة
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                إظهار النقطة الخضراء عند كونك متصل الآن
              </p>
              <Badge variant="outline" className="mt-2 bg-white/50">
                {showOnlineStatus ? 'ظاهر' : 'مخفي'}
              </Badge>
            </div>
          </div>
          <Switch
            checked={showOnlineStatus}
            onCheckedChange={setShowOnlineStatus}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>

        {/* Read Receipts Setting */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <Label className="text-base font-semibold text-gray-800">
                إشعارات القراءة
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                السماح للآخرين برؤية "تم المشاهدة" في الرسائل
              </p>
              <Badge variant="outline" className="mt-2 bg-white/50">
                {readReceipts ? 'تظهر' : 'لا تظهر'}
              </Badge>
            </div>
          </div>
          <Switch
            checked={readReceipts}
            onCheckedChange={setReadReceipts}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>

        {/* Privacy Info */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">معلومات الخصوصية</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                يمكنك التحكم في مستوى الخصوصية الخاص بك. إعطاء هذه الإعدادات يساعد في بناء ثقة أكبر مع أصدقائك، 
                ولكن يمكنك إيقافها في أي وقت للحصول على خصوصية كاملة.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}