// src/components/PreferenceModal/steps/AppearancePreferenceStep.tsx
import { Check } from "lucide-react";

interface AppearancePreferenceStepProps {
  heightMin: number;
  heightMax: number;
  weightMin: number;
  weightMax: number;
  skinTonePreference: string;
  onHeightMinChange: (value: number) => void;
  onHeightMaxChange: (value: number) => void;
  onWeightMinChange: (value: number) => void;
  onWeightMaxChange: (value: number) => void;
  onSkinToneChange: (value: string) => void;
}

const skinColors = [
  { id: "very-light", color: "#F9E4D4" },
  { id: "light", color: "#EBCBB6" },
  { id: "medium", color: "#D8A786" },
  { id: "tanned", color: "#C68642" },
  { id: "brown", color: "#8D5524" },
  { id: "dark", color: "#3B2219" },
];

export default function AppearancePreferenceStep({
  heightMin,
  heightMax,
  weightMin,
  weightMax,
  skinTonePreference,
  onHeightMinChange,
  onHeightMaxChange,
  onWeightMinChange,
  onWeightMaxChange,
  onSkinToneChange,
}: AppearancePreferenceStepProps) {
  return (
    <>
      {/* Hero Image — exactement comme WorkStep & EducationStep */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-secondary/50 to-accent/60 overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/4 left-1/2 transform -translate-x-1/2 animate-bounce">
              🧍
            </div>
          </div>
        </div>
      </div>

      {/* Form Content — suit directement en dessous, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Apparence recherchée
        </h2>

        {/* Taille */}
        <div className="mb-8">
          <label className="block text-base font-semibold text-gray-800 mb-4">
            Taille
          </label>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Minimum</span>
              <span className="text-xl font-bold text-primary">
                {heightMin} cm
              </span>
            </div>
            <input
              type="range"
              min="140"
              max="220"
              value={heightMin}
              onChange={(e) => onHeightMinChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                  ((heightMin - 140) / 80) * 100
                }%, #E5E7EB ${((heightMin - 140) / 80) * 100}%, #E5E7EB 100%)`,
              }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Maximum</span>
              <span className="text-xl font-bold text-primary">
                {heightMax} cm
              </span>
            </div>
            <input
              type="range"
              min="140"
              max="220"
              value={heightMax}
              onChange={(e) => onHeightMaxChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                  ((heightMax - 140) / 80) * 100
                }%, #E5E7EB ${((heightMax - 140) / 80) * 100}%, #E5E7EB 100%)`,
              }}
            />
          </div>
        </div>

        {/* Poids */}
        <div className="mb-8">
          <label className="block text-base font-semibold text-gray-800 mb-4">
            Poids
          </label>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Minimum</span>
              <span className="text-xl font-bold text-primary">
                {weightMin} kg
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="150"
              value={weightMin}
              onChange={(e) => onWeightMinChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                  ((weightMin - 40) / 110) * 100
                }%, #E5E7EB ${((weightMin - 40) / 110) * 100}%, #E5E7EB 100%)`,
              }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Maximum</span>
              <span className="text-xl font-bold text-primary">
                {weightMax} kg
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="150"
              value={weightMax}
              onChange={(e) => onWeightMaxChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                  ((weightMax - 40) / 110) * 100
                }%, #E5E7EB ${((weightMax - 40) / 110) * 100}%, #E5E7EB 100%)`,
              }}
            />
          </div>
        </div>

        {/* Couleur de peau */}
        <div>
          <label className="block text-base font-semibold text-gray-800 mb-4">
            Couleur de peau
          </label>

          <div className="flex flex-wrap gap-3 mb-6">
            {skinColors.map((color) => (
              <button
                key={color.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  skinTonePreference === color.id
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:scale-110"
                }`}
                onClick={() => onSkinToneChange(color.id)}
                style={{ backgroundColor: color.color }}
              >
                {skinTonePreference === color.id && (
                  <Check className="w-5 h-5 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
              skinTonePreference === "any"
                ? "bg-primary/10 border-primary"
                : "bg-gray-50 border-transparent hover:bg-gray-100"
            }`}
            onClick={() => onSkinToneChange("any")}
          >
            <span className="text-lg font-medium text-gray-800">
              Peu importe
            </span>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                skinTonePreference === "any"
                  ? "border-primary bg-primary"
                  : "border-gray-400"
              }`}
            >
              {skinTonePreference === "any" && (
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              )}
            </div>
          </div>
        </div>

        {/* Espace en bas pour que le dernier champ ne colle pas le bas de l'écran */}
        <div className="h-24" />
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        }
      `}</style>
    </>
  );
}
