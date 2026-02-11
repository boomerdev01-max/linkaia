import { Option } from "@/components/ModalSteps/types";
interface HabitsStepProps {
  smoker: string;
  alcohol: string;
  onSmokerChange: (value: string) => void;
  onAlcoholChange: (value: string) => void;
}

const smokerOptions: Option[] = [
  { id: "never", label: "Jamais" },
  { id: "sometimes", label: "Parfois" },
  { id: "regularly", label: "Régulièrement" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

const alcoholOptions: Option[] = [
  { id: "never", label: "Jamais" },
  { id: "socially", label: "Occasionnel" },
  { id: "regularly", label: "Régulièrement" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export default function HabitsStep({
  smoker,
  alcohol,
  onSmokerChange,
  onAlcoholChange,
}: HabitsStepProps) {
  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-accent/50 to-primary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-7xl absolute top-1/4 left-1/4 animate-pulse">
              🚭
            </div>
            <div
              className="text-7xl absolute top-1/3 right-1/4 animate-bounce"
              style={{ animationDelay: "0.3s" }}
            >
              🍷
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        {/* Tabac */}
        <div className="mb-8">
          <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
            Fumez-vous ?
          </h2>
          <div className="space-y-3">
            {smokerOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                  smoker === option.id
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
                onClick={() => onSmokerChange(option.id)}
              >
                <span className="text-lg font-medium text-gray-800">
                  {option.label}
                </span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    smoker === option.id
                      ? "border-primary bg-primary"
                      : "border-gray-400"
                  }`}
                >
                  {smoker === option.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alcool */}
        <div>
          <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
            Consommez-vous de l'alcool ?
          </h2>
          <div className="space-y-3">
            {alcoholOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                  alcohol === option.id
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
                onClick={() => onAlcoholChange(option.id)}
              >
                <span className="text-lg font-medium text-gray-800">
                  {option.label}
                </span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    alcohol === option.id
                      ? "border-primary bg-primary"
                      : "border-gray-400"
                  }`}
                >
                  {alcohol === option.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-24" />
      </div>
    </>
  );
}
