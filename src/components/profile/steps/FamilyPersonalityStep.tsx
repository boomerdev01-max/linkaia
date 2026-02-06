import { Option } from "@/components/ModalSteps/types";

interface FamilyPersonalityStepProps {
  hasChildren: string;
  wantsChildren: string;
  hasPets: string;
  personalityType: string;
  onHasChildrenChange: (value: string) => void;
  onWantsChildrenChange: (value: string) => void;
  onHasPetsChange: (value: string) => void;
  onPersonalityTypeChange: (value: string) => void;
}

const hasChildrenOptions: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "soon", label: "Bientôt" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

const wantsChildrenOptions: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "maybe", label: "Peut-être" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

const hasPetsOptions: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "want-one", label: "J'en veux un" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

const personalityOptions: Option[] = [
  { id: "introvert", label: "Introverti(e)" },
  { id: "extrovert", label: "Extraverti(e)" },
  { id: "ambivert", label: "Ambivert(e)" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export default function FamilyPersonalityStep({
  hasChildren,
  wantsChildren,
  hasPets,
  personalityType,
  onHasChildrenChange,
  onWantsChildrenChange,
  onHasPetsChange,
  onPersonalityTypeChange,
}: FamilyPersonalityStepProps) {
  const renderOptions = (
    options: Option[],
    value: string,
    onChange: (v: string) => void,
  ) => (
    <div className="space-y-3">
      {options.map((option) => (
        <div
          key={option.id}
          className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
            value === option.id
              ? "bg-primary/10 border-primary"
              : "bg-gray-50 border-transparent hover:bg-gray-100"
          }`}
          onClick={() => onChange(option.id)}
        >
          <span className="text-lg font-medium text-gray-800">
            {option.label}
          </span>
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
  );

  return (
    <>
      {/* Hero Image — même structure que les autres étapes */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-primary via-secondary/50 to-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-7xl absolute top-1/4 left-1/4 animate-bounce">
              👶
            </div>
            <div
              className="text-7xl absolute top-1/3 right-1/4 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            >
              🐕
            </div>
            {/* Tu peux ajouter un élément décoratif supplémentaire si tu veux homogénéiser */}
            {/* <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/80 rounded-xl shadow-xl transform -rotate-6 border-4 border-secondary/60" /> */}
          </div>
        </div>
      </div>

      {/* Contenu du formulaire — suit directement, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <div className="space-y-8">
          {/* Avez-vous des enfants ? */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Avez-vous des enfants ?
            </h3>
            {renderOptions(
              hasChildrenOptions,
              hasChildren,
              onHasChildrenChange,
            )}
          </div>

          {/* En voulez-vous ? */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              En voulez-vous ?
            </h3>
            {renderOptions(
              wantsChildrenOptions,
              wantsChildren,
              onWantsChildrenChange,
            )}
          </div>

          {/* Avez-vous des animaux ? */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Avez-vous des animaux ?
            </h3>
            {renderOptions(hasPetsOptions, hasPets, onHasPetsChange)}
          </div>

          {/* Votre personnalité */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Votre personnalité
            </h3>
            {renderOptions(
              personalityOptions,
              personalityType,
              onPersonalityTypeChange,
            )}
          </div>
        </div>

        {/* Espace en bas pour confort sur mobile */}
        <div className="h-24" />
      </div>
    </>
  );
}
