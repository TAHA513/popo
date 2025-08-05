import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            LaaBoBo Live
          </h1>
          <p className="text-gray-600">
            التطبيق يعمل بنجاح!
          </p>
        </div>
      </div>
    </QueryClientProvider>
  );
}