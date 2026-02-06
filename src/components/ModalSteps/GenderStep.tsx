import { Option } from "../ModalSteps/types";

interface GenderStepProps {
  value: string;
  onSelect: (value: string) => void;
}

const genderOptions: Option[] = [
  { id: "man", label: "Homme" },
  { id: "woman", label: "Femme" },
  { id: "non-binary", label: "Non-binaire" },
  { id: "prefer-not-say", label: "Je préfère ne pas le dire" },
];

export default function GenderStep({ value, onSelect }: GenderStepProps) {
  return (
    <>
      {/* Hero Image - Gender */}
      <div className="relative h-[343px] w-full bg-gradient-to-br from-primary via-secondary/50 to-accent/60 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Illustration abstraite style Badoo - Genre */}
            <div className="relative w-full h-full max-w-md">
              {/* Forme 1 - Visage gauche (style féminin) */}
              <div className="absolute left-0 top-1/4 w-48 h-48 bg-gradient-to-br from-accent to-accent/80 rounded-tl-[80px] rounded-tr-[20px] rounded-bl-[40px] rounded-br-[100px] transform -rotate-6">
                {/* Col/Accessoire */}
                <div
                  className="absolute -bottom-8 left-8 w-24 h-20 bg-secondary rounded-[40px] border-4 border-white"
                  style={{ clipPath: "ellipse(50% 40% at 50% 50%)" }}
                />
              </div>

              {/* Forme 2 - Visage droit (style masculin) */}
              <div className="absolute right-8 top-1/4 w-56 h-48 bg-gradient-to-br from-primary-dark to-primary rounded-[30px] transform rotate-3">
                {/* Yeux */}
                <div className="absolute top-12 left-8 w-16 h-12 bg-white rounded-full flex items-center justify-center">
                  <div className="w-8 h-10 bg-black rounded-full" />
                </div>
                <div className="absolute top-12 right-8 w-16 h-12 bg-white rounded-full flex items-center justify-center">
                  <div className="w-8 h-10 bg-black rounded-full" />
                </div>
              </div>

              {/* Formes décoratives */}
              <div className="absolute top-8 left-1/3 w-32 h-24 bg-secondary/70 rounded-[20px] transform -rotate-12" />
              <div className="absolute top-4 right-12 w-40 h-32 bg-primary rounded-tl-[60px] rounded-tr-[20px] rounded-br-[40px] transform rotate-12" />

              {/* Motifs décoratifs */}
              <div className="absolute bottom-16 right-4 flex flex-col gap-2">
                <div className="w-1 h-8 bg-accent transform rotate-12" />
                <div className="w-1 h-8 bg-accent transform rotate-12" />
                <div className="w-1 h-8 bg-accent transform rotate-12" />
              </div>

              <div className="absolute bottom-12 right-16 flex gap-1">
                <div className="w-3 h-3 bg-primary-dark rounded-full" />
                <div className="w-3 h-3 bg-primary-dark rounded-full" />
                <div className="w-3 h-3 bg-primary-dark rounded-full" />
              </div>

              {/* Bouche/Sourire */}
              <div
                className="absolute top-32 left-24 w-20 h-3 bg-primary/30 rounded-full"
                style={{ clipPath: "ellipse(50% 30% at 50% 100%)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-[22px] pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Quel est votre genre ?
        </h2>

        <div className="space-y-3">
          {genderOptions.map((option) => (
            <div
              key={option.id}
              className={`flex items-center justify-between px-6 py-[13px] h-[50px] rounded-full cursor-pointer transition-all duration-200 border-2 ${
                value === option.id
                  ? "bg-primary/10 border-primary"
                  : "bg-gray-50 border-transparent hover:bg-gray-100"
              }`}
              onClick={() => onSelect(option.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelect(option.id);
                }
              }}
            >
              <span className="text-lg font-medium text-gray-800">
                {option.label}
              </span>
              <input
                type="radio"
                name="gender"
                value={option.id}
                checked={value === option.id}
                onChange={(e) => onSelect(e.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  value === option.id
                    ? "border-primary bg-primary"
                    : "border-gray-400"
                }`}
              >
                {value === option.id && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Spacer pour éviter que le contenu soit caché par la navigation */}
        <div className="h-24" />
      </div>
    </>
  );
}