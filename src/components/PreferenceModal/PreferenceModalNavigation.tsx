import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface PreferenceModalNavigationProps {
  currentStep: number;
  totalSteps: number;
  hasSelection: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function PreferenceModalNavigation({
  currentStep,
  totalSteps,
  hasSelection,
  onPrevious,
  onNext,
}: PreferenceModalNavigationProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] shrink-0 rounded-b-3xl relative z-20">
      <div className="flex items-center justify-between gap-6 max-w-sm mx-auto">
        {currentStep > 0 ? (
          <button
            onClick={onPrevious}
            className="w-14 h-14 rounded-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all active:scale-95 shrink-0"
            aria-label="Étape précédente"
          >
            <ChevronLeft className="w-7 h-7 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
          </button>
        ) : (
          <div className="w-14 h-14 shrink-0" />
        )}

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{currentStep + 1} / {totalSteps}</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden w-full shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {hasSelection ? (
          <button
            onClick={onNext}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-lg shadow-purple-500/30"
            aria-label="Étape suivante (Valider)"
          >
            <Check className="w-7 h-7 text-white" strokeWidth={3.5} />
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-14 h-14 rounded-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all active:scale-95 shrink-0 group"
            aria-label="Passer / Étape suivante"
          >
            <ChevronRight className="w-7 h-7 text-gray-400 group-hover:text-gray-700 dark:text-gray-600 dark:group-hover:text-gray-300" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}