import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    
    // محاولة استخراج الرسالة من JSON response
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) {
        throw new Error(parsed.message);
      }
    } catch (e) {
      // إذا فشل في parsing JSON، استخدم النص كما هو
    }
    
    // استخدام النص مباشرة أو statusText كبديل، بدون رقم الخطأ
    throw new Error(text || res.statusText);
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET', 
  data?: unknown | undefined,
): Promise<any> {
  const isFormData = data instanceof FormData;
  
  console.log('🌐 إرسال طلب API:', { url: url, method: method, data: data });
  
  const res = await fetch(url, {
    method,
    headers: isFormData ? {} : (data ? { "Content-Type": "application/json" } : {}),
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  console.log('📡 استجابة الخادم:', { status: res.status, statusText: res.statusText });

  await throwIfResNotOk(res);
  const result = await res.json();
  console.log('✅ نتيجة الطلب:', result);
  return result;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // منع التحديث التلقائي المستمر
      refetchOnWindowFocus: false, // منع التحديث عند العودة للتبويب
      staleTime: 1000 * 60 * 2, // البيانات تبقى حديثة لمدة 2 دقيقة (للاستجابة السريعة)
      retry: 1, // محاولة واحدة فقط
      networkMode: 'offlineFirst', // استخدام البيانات المخزنة أولاً
    },
    mutations: {
      retry: 1, // محاولة واحدة فقط للطفرات
    },
  },
});
