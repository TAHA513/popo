import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StreamContextType {
  isStreaming: boolean;
  streamId: string | null;
  streamTitle: string;
  setStreamActive: (id: string, title: string) => void;
  setStreamInactive: () => void;
}

const StreamContext = createContext<StreamContextType>({
  isStreaming: false,
  streamId: null,
  streamTitle: '',
  setStreamActive: () => {},
  setStreamInactive: () => {}
});

export function useStreamContext() {
  return useContext(StreamContext);
}

interface StreamProviderProps {
  children: ReactNode;
}

export function StreamProvider({ children }: StreamProviderProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState('');

  // حفظ حالة البث في localStorage
  useEffect(() => {
    // Skip localStorage operations on server-side rendering
    if (typeof window === 'undefined') return;
    
    try {
      const savedStreamData = localStorage.getItem('activeStream');
      if (savedStreamData) {
        const { id, title, timestamp } = JSON.parse(savedStreamData);
        // تحقق من أن البث ليس قديماً جداً (أكثر من 6 ساعات)
        const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
        if (timestamp > sixHoursAgo) {
          setIsStreaming(true);
          setStreamId(id);
          setStreamTitle(title);
        } else {
          localStorage.removeItem('activeStream');
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات البث المحفوظة:', error);
      localStorage.removeItem('activeStream');
    }
  }, []);

  const setStreamActive = (id: string, title: string) => {
    setIsStreaming(true);
    setStreamId(id);
    setStreamTitle(title);
    
    // حفظ في localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('activeStream', JSON.stringify({
          id,
          title,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('خطأ في حفظ بيانات البث:', error);
      }
    }
  };

  const setStreamInactive = () => {
    setIsStreaming(false);
    setStreamId(null);
    setStreamTitle('');
    
    // إزالة من localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('activeStream');
      } catch (error) {
        console.error('خطأ في إزالة بيانات البث:', error);
      }
    }
  };

  const value = {
    isStreaming,
    streamId,
    streamTitle,
    setStreamActive,
    setStreamInactive
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
}