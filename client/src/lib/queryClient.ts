import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET', 
  data?: unknown | undefined,
): Promise<any> {
  const isFormData = data instanceof FormData;
  
  // Use production API for unified data access
  const API_BASE = import.meta.env.VITE_API_URL || 'https://617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev';
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: isFormData ? {} : (data ? { "Content-Type": "application/json" } : {}),
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use production API for unified data access
    const API_BASE = import.meta.env.VITE_API_URL || 'https://617f9402-3c68-4da7-9c19-a3c88da03abf-00-2skomkci4x2ov.worf.replit.dev';
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    
    const res = await fetch(fullUrl, {
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
      staleTime: 1000 * 60 * 5, // البيانات تبقى حديثة لمدة 5 دقائق
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
