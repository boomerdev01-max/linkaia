import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Option } from "@/components/ModalSteps/types";

interface EducationStepProps {
  educationLevel: string;
  studyPlace: string;
  onEducationLevelChange: (value: string) => void;
  onStudyPlaceChange: (value: string) => void;
}

const educationLevelOptions: Option[] = [
  { id: "high-school", label: "Lycée" },
  { id: "bachelor", label: "Licence / Bachelor" },
  { id: "master", label: "Master" },
  { id: "doctorate", label: "Doctorat" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export default function EducationStep({
  educationLevel,
  studyPlace,
  onEducationLevelChange,
  onStudyPlaceChange,
}: EducationStepProps) {
  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-accent/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/4 left-1/2 transform -translate-x-1/2 animate-bounce">
              🎓
            </div>
            <div className="absolute bottom-16 left-8 w-40 h-32 bg-white rounded-lg shadow-xl transform -rotate-6 overflow-hidden border-4 border-primary" />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Vos études
        </h2>

        {/* Niveau d'études */}
        <div className="mb-6">
          <Label className="block text-base font-semibold text-gray-800 mb-3">
            Niveau d'études
          </Label>
          <div className="space-y-3">
            {educationLevelOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                  educationLevel === option.id
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
                onClick={() => onEducationLevelChange(option.id)}
              >
                <span className="text-lg font-medium text-gray-800">
                  {option.label}
                </span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    educationLevel === option.id
                      ? "border-primary bg-primary"
                      : "border-gray-400"
                  }`}
                >
                  {educationLevel === option.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lieu d'études */}
        <div>
          <Label
            htmlFor="studyPlace"
            className="block text-base font-semibold text-gray-800 mb-3"
          >
            Établissement d'études
          </Label>
          <Input
            id="studyPlace"
            type="text"
            placeholder="Université, école..."
            value={studyPlace}
            onChange={(e) => onStudyPlaceChange(e.target.value)}
            className="h-12 text-base rounded-full px-6"
          />
        </div>

        <div className="h-24" />
      </div>
    </>
  );
}
