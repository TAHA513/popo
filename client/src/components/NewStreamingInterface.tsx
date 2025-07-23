import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Stream } from "@/types";
import NewLiveStreamer from "./NewLiveStreamer";
import NewLiveViewer from "./NewLiveViewer";

interface NewStreamingInterfaceProps {
  stream: Stream;
}

export default function NewStreamingInterface({ stream }: NewStreamingInterfaceProps) {
  const { user } = useAuth();
  const [isStreamer, setIsStreamer] = useState(false);

  // تحديد ما إذا كان المستخدم هو الصاميمر
  useEffect(() => {
    if (user && stream) {
      setIsStreamer(user.id === stream.hostId);
      console.log('🎭 تحديد دور المستخدم:', {
        userId: user.id,
        hostId: stream.hostId,
        isStreamer: user.id === stream.hostId,
        streamTitle: stream.title
      });
    }
  }, [user, stream]);

  // إنهاء البث (للصاميمر فقط)
  const endStreamMutation = useMutation({
    mutationFn: () => apiRequest(`/api/streams/${stream.id}`, "DELETE"),
    onSuccess: () => {
      console.log('✅ تم حذف البث بنجاح');
      handleClose();
    },
    onError: (error) => {
      console.error('❌ خطأ في حذف البث:', error);
      handleClose(); // إغلاق حتى لو فشل الحذف
    }
  });

  const handleClose = () => {
    // العودة للصفحة الرئيسية
    window.history.back();
  };

  const handleEndStream = () => {
    if (isStreamer) {
      endStreamMutation.mutate();
    } else {
      handleClose();
    }
  };

  // عرض مكون الصاميمر أو المشاهد حسب الدور
  if (isStreamer) {
    return (
      <NewLiveStreamer 
        stream={stream} 
        onClose={handleEndStream}
      />
    );
  } else {
    return (
      <NewLiveViewer 
        stream={stream} 
        onClose={handleClose}
      />
    );
  }
}