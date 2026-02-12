import { Option } from "@/components/ModalSteps/types";

interface OrientationRelationshipStepProps {
  sexualOrientation: string;
  relationshipStatus: string;
  onOrientationChange: (value: string) => void;
  onRelationshipChange: (value: string) => void;
}

const orientationOptions: Option[] = [
  { id: "hetero", label: "Hétérosexuel(le)" },
  { id: "homo", label: "Homosexuel(le)" },
  { id: "bi", label: "Bisexuel(le)" },
  { id: "pan", label: "Pansexuel(le)" },
  { id: "asexual", label: "Asexuel(le)" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

const relationshipOptions: Option[] = [
  { id: "single", label: "Célibataire" },
  { id: "couple", label: "En couple" },
  { id: "complicated", label: "C'est compliqué" },
  { id: "open", label: "En relation libre" },
  { id: "married", label: "Marié(e)" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export default function OrientationRelationshipStep({
  sexualOrientation,
  relationshipStatus,
  onOrientationChange,
  onRelationshipChange,
}: OrientationRelationshipStepProps) {
  return (
    <>
      {/* Hero Image - Orientation & Relationship */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-accent/60 to-primary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Illustration abstraite style Badoo */}
            <div className="relative w-full h-full max-w-md">
              {/* Forme 1 - Visage gauche */}
              <div className="absolute left-0 top-1/4 w-48 h-48 bg-linear-to-br from-secondary to-secondary/80 rounded-tl-[80px] rounded-tr-4xl rounded-bl-[40px] rounded-br-[100px] transform -rotate-6">
                {/* Col rouge */}
                <div
                  className="absolute -bottom-8 left-8 w-24 h-20 bg-accent rounded-[40px] border-4 border-white"
                  style={{ clipPath: "ellipse(50% 40% at 50% 50%)" }}
                />
              </div>

              {/* Forme 2 - Visage droit */}
              <div className="absolute right-8 top-1/4 w-56 h-48 bg-linear-to-br from-primary to-primary-dark rounded-[30px] transform rotate-3">
                {/* Yeux */}
                <div className="absolute top-12 left-8 w-16 h-12 bg-white rounded-full flex items-center justify-center">
                  <div className="w-8 h-10 bg-black rounded-full" />
                </div>
                <div className="absolute top-12 right-8 w-16 h-12 bg-white rounded-full flex items-center justify-center">
                  <div className="w-8 h-10 bg-black rounded-full" />
                </div>
              </div>

              {/* Coeur au centre */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl animate-pulse">
                ❤️
              </div>

              {/* Formes décoratives */}
              <div className="absolute top-8 left-1/3 w-32 h-24 bg-primary/60 rounded-4xl transform -rotate-12" />
              <div className="absolute bottom-16 right-4 flex flex-col gap-2">
                <div className="w-1 h-8 bg-primary-dark transform rotate-12" />
                <div className="w-1 h-8 bg-primary-dark transform rotate-12" />
                <div className="w-1 h-8 bg-primary-dark transform rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        {/* Orientation sexuelle */}
        <div className="mb-8">
          <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
            Quelle est votre orientation sexuelle ?
          </h2>

          <div className="space-y-3">
            {orientationOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                  sexualOrientation === option.id
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
                onClick={() => onOrientationChange(option.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onOrientationChange(option.id);
                  }
                }}
              >
                <span className="text-lg font-medium text-gray-800">
                  {option.label}
                </span>
                <input
                  type="radio"
                  name="orientation"
                  value={option.id}
                  checked={sexualOrientation === option.id}
                  onChange={(e) => onOrientationChange(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                />
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    sexualOrientation === option.id
                      ? "border-primary bg-primary"
                      : "border-gray-400"
                  }`}
                >
                  {sexualOrientation === option.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Situation amoureuse */}
        <div>
          <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
            Quelle est votre situation amoureuse ?
          </h2>

          <div className="space-y-3">
            {relationshipOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between px-6 py-3.25 h-12.5 rounded-full cursor-pointer transition-all duration-200 border-2 ${
                  relationshipStatus === option.id
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
                onClick={() => onRelationshipChange(option.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onRelationshipChange(option.id);
                  }
                }}
              >
                <span className="text-lg font-medium text-gray-800">
                  {option.label}
                </span>
                <input
                  type="radio"
                  name="relationship"
                  value={option.id}
                  checked={relationshipStatus === option.id}
                  onChange={(e) => onRelationshipChange(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                />
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    relationshipStatus === option.id
                      ? "border-primary bg-primary"
                      : "border-gray-400"
                  }`}
                >
                  {relationshipStatus === option.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </div>
    </>
  );
}