import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Option } from "@/components/ModalSteps/types";

interface IdentityStepProps {
  gender: string;
  pseudo: string;
  birthdate: Date | null;
  onGenderChange: (value: string) => void;
  onPseudoChange: (value: string) => void;
  onBirthdateChange: (value: Date | null) => void;
}

const genderOptions: Option[] = [
  { id: "man", label: "Homme" },
  { id: "woman", label: "Femme" },
  { id: "non-binary", label: "Non-binaire" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export default function IdentityStep({
  gender,
  pseudo,
  birthdate,
  onGenderChange,
  onPseudoChange,
  onBirthdateChange,
}: IdentityStepProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    onBirthdateChange(dateValue ? new Date(dateValue) : null);
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <>
      {/* Hero Image - Identity */}
      <div className="relative h-[343px] w-full bg-gradient-to-br from-primary via-secondary/50 to-accent/60 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Illustration abstraite style Badoo - Identité */}
            <div className="relative w-full h-full max-w-md">
              {/* Forme principale - Visage */}
              <div className="absolute left-1/4 top-1/4 w-56 h-56 bg-gradient-to-br from-primary to-primary-dark rounded-[40px] transform -rotate-6">
                {/* Yeux */}
                <div className="absolute top-16 left-12 w-14 h-10 bg-white rounded-full flex items-center justify-center">
                  <div className="w-6 h-8 bg-black rounded-full" />
                </div>
                <div className="absolute top-16 right-12 w-14 h-10 bg-white rounded-full flex items-center justify-center">
                  <div className="w-6 h-8 bg-black rounded-full" />
                </div>

                {/* Sourire */}
                <div
                  className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-accent rounded-full"
                  style={{ clipPath: "ellipse(50% 30% at 50% 100%)" }}
                />
              </div>

              {/* Badge ID */}
              <div className="absolute right-8 top-12 w-32 h-40 bg-white rounded-lg shadow-xl transform rotate-12 border-4 border-accent">
                <div className="p-3 flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary rounded-full mb-2" />
                  <div className="w-20 h-2 bg-gray-300 rounded mb-1" />
                  <div className="w-16 h-2 bg-gray-300 rounded" />
                </div>
              </div>

              {/* Formes décoratives */}
              <div className="absolute bottom-12 left-4 w-24 h-24 bg-secondary/70 rounded-full" />
              <div className="absolute top-8 right-20 w-16 h-16 bg-accent/60 rounded-[20px] transform rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-[22px] pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Parlez-nous de vous
        </h2>

        {/* Genre */}
        <div className="mb-6">
          <Label className="block text-base font-semibold text-gray-800 mb-3">
            Genre <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-3">
            {genderOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between px-6 py-[13px] h-[50px] rounded-full cursor-pointer transition-all duration-200 border-2 ${
                  gender === option.id
                    ? "bg-primary/10 border-primary"
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
                onClick={() => onGenderChange(option.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onGenderChange(option.id);
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
                  checked={gender === option.id}
                  onChange={(e) => onGenderChange(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                />
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    gender === option.id
                      ? "border-primary bg-primary"
                      : "border-gray-400"
                  }`}
                >
                  {gender === option.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pseudo */}
        <div className="mb-6">
          <Label
            htmlFor="pseudo"
            className="block text-base font-semibold text-gray-800 mb-3"
          >
            Pseudo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pseudo"
            type="text"
            placeholder="Choisissez votre pseudo"
            value={pseudo}
            onChange={(e) => onPseudoChange(e.target.value)}
            className="h-12 text-base rounded-full px-6"
          />
        </div>

        {/* Date de naissance */}
        <div>
          <Label
            htmlFor="birthdate"
            className="block text-base font-semibold text-gray-800 mb-3"
          >
            Date de naissance <span className="text-red-500">*</span>
          </Label>
          <Input
            id="birthdate"
            type="date"
            value={formatDateForInput(birthdate)}
            onChange={handleDateChange}
            className="h-12 text-base rounded-full px-6"
            max={
              new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                .toISOString()
                .split("T")[0]
            }
          />
          <p className="text-sm text-gray-500 mt-2">
            Vous devez avoir au moins 18 ans pour vous inscrire
          </p>
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </div>
    </>
  );
}
