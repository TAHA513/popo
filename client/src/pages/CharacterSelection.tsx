import { Suspense } from "react";
import CharacterSelector from "@/components/CharacterSelector";

export default function CharacterSelection() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الشخصيات...</p>
        </div>
      </div>
    }>
      <CharacterSelector />
    </Suspense>
  );
}