import { Option } from "@/components/ModalSteps/types";

interface ConvictionsStepProps {
  zodiacSign: string;
  religion: string;
  loveAnimals: string;
  onZodiacSignChange: (value: string) => void;
  onReligionChange: (value: string) => void;
  onLoveAnimalsChange: (value: string) => void;
}

const zodiacSignOptions: Option[] = [
  { id: "aries", label: "♈ Bélier" },
  { id: "taurus", label: "♉ Taureau" },
  { id: "gemini", label: "♊ Gémeaux" },
  { id: "cancer", label: "♋ Cancer" },
  { id: "leo", label: "♌ Lion" },
  { id: "virgo", label: "♍ Vierge" },
  { id: "libra", label: "♎ Balance" },
  { id: "scorpio", label: "♏ Scorpion" },
  { id: "sagittarius", label: "♐ Sagittaire" },
  { id: "capricorn", label: "♑ Capricorne" },
  { id: "aquarius", label: "♒ Verseau" },
  { id: "pisces", label: "♓ Poissons" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

const religionOptions: Option[] = [
  { id: "atheist", label: "Athée" },
  { id: "christian", label: "Chrétien(ne)" },
  { id: "muslim", label: "Musulman(e)" },
  { id: "jewish", label: "Juif/Juive" },
  { id: "buddhist", label: "Bouddhiste" },
  { id: "hindu", label: "Hindou(e)" },
  { id: "other", label: "Autre" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

const loveAnimalsOptions: Option[] = [
  { id: "yes", label: "Oui" },
  { id: "no", label: "Non" },
  { id: "neutral", label: "Neutre" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export default function ConvictionsStep({
  zodiacSign,
  religion,
  loveAnimals,
  onZodiacSignChange,
  onReligionChange,
  onLoveAnimalsChange,
}: ConvictionsStepProps) {
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
      {/* Hero Image — exactement comme WorkStep & EducationStep */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-accent via-primary/50 to-secondary overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-7xl absolute top-1/4 left-1/3 animate-pulse">
              ⭐
            </div>
            <div
              className="text-7xl absolute bottom-1/4 right-1/3 animate-bounce"
              style={{ animationDelay: "0.4s" }}
            >
              🙏
            </div>
          </div>
        </div>
      </div>

      {/* Form Content — suit directement en dessous, même padding que les autres */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Vos convictions
        </h2>

        <div className="space-y-8">
          {/* Zodiac Sign */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Signe astrologique
            </h3>
            {renderOptions(zodiacSignOptions, zodiacSign, onZodiacSignChange)}
          </div>

          {/* Religion */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Religion
            </h3>
            {renderOptions(religionOptions, religion, onReligionChange)}
          </div>

          {/* Love Animals */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Aimez-vous les animaux ?
            </h3>
            {renderOptions(
              loveAnimalsOptions,
              loveAnimals,
              onLoveAnimalsChange,
            )}
          </div>
        </div>

        {/* Espace en bas pour que le dernier champ ne colle pas le bas de l'écran */}
        <div className="h-24" />
      </div>
    </>
  );
}
