import React from 'react';
import { Button } from '@/components/ui/button';
import { useStreamContext } from '@/contexts/StreamContext';
import { Video } from 'lucide-react';

export function StreamTestButton() {
  const { isStreaming, setStreamActive, setStreamInactive } = useStreamContext();

  const handleToggleStream = () => {
    if (isStreaming) {
      setStreamInactive();
    } else {
      // محاكاة بدء بث جديد
      const streamId = Date.now().toString();
      setStreamActive(streamId, 'بث مباشر تجريبي');
    }
  };

  return (
    <Button
      onClick={handleToggleStream}
      variant={isStreaming ? "destructive" : "default"}
      className="flex items-center gap-2"
    >
      <Video className="w-4 h-4" />
      {isStreaming ? 'إيقاف البث التجريبي' : 'تشغيل بث تجريبي'}
    </Button>
  );
}