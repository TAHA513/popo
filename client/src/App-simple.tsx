import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";

function TestPremiumAlbums() {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/premium-albums/1', {
        credentials: 'include'
      });
      const data = await response.json();
      setMessage(JSON.stringify(data, null, 2));
    } catch (error) {
      setMessage("Error: " + error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">اختبار الألبومات المدفوعة</h2>
      <button 
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        اختبر API الألبوم
      </button>
      <pre className="bg-gray-100 p-4 rounded text-sm">
        {message || "اضغط الزر لاختبار API"}
      </pre>
    </div>
  );
}

export default function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <h1 className="p-4 text-xl font-bold text-center">اختبار النظام</h1>
        <div className="max-w-md mx-auto">
          <TestPremiumAlbums />
        </div>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}