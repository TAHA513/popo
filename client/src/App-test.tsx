import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useState, useEffect } from "react";

function BasicTest() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
        } else {
          setUser(data);
        }
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-red-600">خطأ في المصادقة</h1>
        <p className="mt-2">{error}</p>
        <a href="/login" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
          تسجيل الدخول
        </a>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-center mt-2">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">مرحباً {user.username}</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p>النقاط: {user.points}</p>
        <p>الإيميل: {user.email}</p>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">اختبار الألبومات المدفوعة</h2>
        <button 
          onClick={async () => {
            try {
              const res = await fetch('/api/premium-albums/1', { credentials: 'include' });
              const data = await res.json();
              alert(JSON.stringify(data, null, 2));
            } catch (err) {
              alert('خطأ: ' + err);
            }
          }}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          اختبار ألبوم مدفوع
        </button>
      </div>
    </div>
  );
}

export default function TestApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <BasicTest />
      </div>
    </QueryClientProvider>
  );
}