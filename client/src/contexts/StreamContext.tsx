import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StreamContextType {
  isStreaming: boolean;
  streamId: string | null;
  streamTitle: string;
  setStreamActive: (id: string, title: string) => void;
  setStreamInactive: () => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function useStreamContext() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStreamContext must be used within a StreamProvider');
  }
  return context;
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
    const savedStreamData = localStorage.getItem('activeStream');
    if (savedStreamData) {
      try {
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
      } catch (error) {
        console.error('خطأ في تحميل بيانات البث المحفوظة:', error);
        localStorage.removeItem('activeStream');
      }
    }
  }, []);

  const setStreamActive = (id: string, title: string) => {
    setIsStreaming(true);
    setStreamId(id);
    setStreamTitle(title);
    
    // حفظ في localStorage
    localStorage.setItem('activeStream', JSON.stringify({
      id,
      title,
      timestamp: Date.now()
    }));
  };

  const setStreamInactive = () => {
    setIsStreaming(false);
    setStreamId(null);
    setStreamTitle('');
    
    // إزالة من localStorage
    localStorage.removeItem('activeStream');
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