import { useState } from "react";
import { Check } from "lucide-react";

interface AppearanceStepProps {
  height: number;
  weight: number;
  skinTone: string;
  onHeightChange: (height: number) => void;
  onWeightChange: (weight: number) => void;
  onSkinToneChange: (tone: string) => void;
}

const skinColors = [
  { id: "very-light", label: "Peau très claire", color: "#F9E4D4" },
  { id: "light", label: "Peau claire", color: "#EBCBB6" },
  { id: "medium", label: "Peau médium", color: "#D8A786" },
  { id: "tanned", label: "Peau bronzée", color: "#C68642" },
  { id: "brown", label: "Peau brune", color: "#8D5524" },
  { id: "dark", label: "Peau noire", color: "#3B2219" },
  {
    id: "PREFER_NOT_TO_SAY",
    label: "Je préfère ne pas le dire",
    color: "#E5E7EB",
  },
];

export default function AppearanceStep({
  height = 175,
  weight = 70,
  skinTone = "medium",
  onHeightChange,
  onWeightChange,
  onSkinToneChange,
}: AppearanceStepProps) {
  const [localHeight, setLocalHeight] = useState(height);
  const [localWeight, setLocalWeight] = useState(weight);

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value);
    setLocalHeight(newHeight);
    onHeightChange(newHeight);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = parseInt(e.target.value);
    setLocalWeight(newWeight);
    onWeightChange(newWeight);
  };

  return (
    <>
      {/* Hero Image - Appearance */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-secondary/50 to-accent/60 overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Illustration abstraite style Badoo - Apparence */}
            <div className="relative w-full h-full max-w-md">
              {/* Formes abstraites représentant la diversité */}
              <div className="absolute left-4 top-1/4 w-40 h-40 bg-linear-to-br from-accent to-accent/70 rounded-full opacity-70 transform -rotate-12" />
              <div className="absolute right-8 top-1/3 w-48 h-48 bg-linear-to-br from-primary to-primary-dark rounded-tl-[60px] rounded-br-[60px] transform rotate-12 opacity-80" />

              {/* Formes décoratives */}
              <div className="absolute top-12 left-1/4 w-32 h-32 bg-secondary/60 rounded-full opacity-60" />
              <div className="absolute bottom-16 right-12 w-36 h-36 bg-accent/50 rounded-[40px] transform rotate-45" />

              {/* Barres verticales représentant la taille */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-end gap-1 h-24">
                <div className="w-2 h-16 bg-white rounded-full opacity-80" />
                <div className="w-2 h-20 bg-white rounded-full opacity-80" />
                <div className="w-2 h-24 bg-white rounded-full opacity-80" />
              </div>

              {/* Emoji représentatif */}
              <div className="absolute top-8 right-4 text-6xl animate-bounce">
                🧍
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          À quoi ressemblez-vous ?
        </h2>

        {/* Section Taille */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-semibold text-gray-800">
              Votre taille
            </label>
            <span className="text-2xl font-bold text-primary">
              {localHeight} <span className="text-base text-gray-500">cm</span>
            </span>
          </div>

          <input
            type="range"
            min="140"
            max="220"
            value={localHeight}
            onChange={handleHeightChange}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer mb-6"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                ((localHeight - 140) / 80) * 100
              }%, #E5E7EB ${((localHeight - 140) / 80) * 100}%, #E5E7EB 100%)`,
            }}
          />
        </div>

        {/* Section Poids */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <label className="text-lg font-semibold text-gray-800">
              Votre poids
            </label>
            <span className="text-2xl font-bold text-primary">
              {localWeight} <span className="text-base text-gray-500">kg</span>
            </span>
          </div>

          <input
            type="range"
            min="40"
            max="150"
            value={localWeight}
            onChange={handleWeightChange}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer mb-6"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                ((localWeight - 40) / 110) * 100
              }%, #E5E7EB ${((localWeight - 40) / 110) * 100}%, #E5E7EB 100%)`,
            }}
          />
        </div>

        {/* Section Couleur de peau */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-4">
            Couleur de peau
          </label>

          {/* Palette de couleurs */}
          <div className="flex flex-wrap gap-3 mb-6">
            {skinColors
              .filter((c) => c.id !== "PREFER_NOT_TO_SAY")
              .map((color) => (
                <button
                  key={color.id}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    skinTone === color.id
                      ? "ring-2 ring-primary ring-offset-2"
                      : "hover:scale-110"
                  }`}
                  onClick={() => onSkinToneChange(color.id)}
                  style={{ backgroundColor: color.color }}
                  title={color.label}
                >
                  {skinTone === color.id && (
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
          </div>

          {/* Option "Je préfère ne pas le dire" */}
          <div
            className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
              skinTone === "PREFER_NOT_TO_SAY"
                ? "bg-primary/10 border-primary"
                : "bg-gray-50 border-transparent hover:bg-gray-100"
            }`}
            onClick={() => onSkinToneChange("PREFER_NOT_TO_SAY")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSkinToneChange("PREFER_NOT_TO_SAY");
              }
            }}
          >
            <span className="text-lg font-medium text-gray-800">
              Je préfère ne pas le dire
            </span>
            <input
              type="radio"
              name="skin"
              checked={skinTone === "PREFER_NOT_TO_SAY"}
              onChange={() => onSkinToneChange("PREFER_NOT_TO_SAY")}
              className="sr-only"
              tabIndex={-1}
            />
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                skinTone === "PREFER_NOT_TO_SAY"
                  ? "border-primary bg-primary"
                  : "border-gray-400"
              }`}
            >
              {skinTone === "PREFER_NOT_TO_SAY" && (
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              )}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </div>

      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          margin-top: -10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
        }

        input[type="range"]::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: #e5e7eb;
          border-radius: 9999px;
        }
      `}</style>
    </>
  );
}
