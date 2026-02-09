// src/app/club/checkout/page.tsx
import { Suspense } from "react";
import ClubCheckoutContent from "@/components/club/ClubCheckoutContent";

export default function ClubCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-linear-to-r from-[#0F4C5C] to-[#0A3A47] text-white px-6 py-3 rounded-full mb-6 shadow-lg">
                <div className="w-6 h-6 animate-pulse bg-white/30 rounded"></div>
                <span className="font-bold text-lg">Club fermé LWB</span>
              </div>

              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mt-12">
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
                  ></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      }
    >
      <ClubCheckoutContent />
    </Suspense>
  );
}
