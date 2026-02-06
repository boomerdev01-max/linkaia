import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface ModalNavigationProps {
  currentStep: number;
  totalSteps: number;
  hasSelection: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function ModalNavigation({
  currentStep,
  totalSteps,
  hasSelection,
  onPrevious,
  onNext,
}: ModalNavigationProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="border-t border-gray-100 bg-white px-6 py-5 shadow-lg shrink-0">
      <div className="flex items-center justify-between gap-4">
        {currentStep > 0 ? (
          <button
            onClick={onPrevious}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        ) : (
          <div className="w-12 h-12 shrink-0" />
        )}

        <div className="flex-1">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {hasSelection ? (
          <button
            onClick={onNext}
            className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all shrink-0 shadow-lg"
          >
            <Check className="w-6 h-6 text-white" strokeWidth={3} />
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}
