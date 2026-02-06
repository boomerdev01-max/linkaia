import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkStepProps {
  jobTitle: string;
  companyName: string;
  onJobTitleChange: (value: string) => void;
  onCompanyNameChange: (value: string) => void;
}

export default function WorkStep({
  jobTitle,
  companyName,
  onJobTitleChange,
  onCompanyNameChange,
}: WorkStepProps) {
  return (
    <>
      {/* Hero Image */}
      <div className="relative h-85.75 w-full bg-linear-to-br from-secondary via-primary/50 to-accent overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-md">
            <div className="text-8xl absolute top-1/4 left-1/2 transform -translate-x-1/2 animate-pulse">
              💼
            </div>
            <div className="absolute bottom-16 right-8 w-48 h-32 bg-white rounded-lg shadow-xl transform rotate-6 border-4 border-accent" />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-5.5 pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-6">
          Votre travail
        </h2>

        <div className="space-y-6">
          <div>
            <Label
              htmlFor="jobTitle"
              className="block text-base font-semibold text-gray-800 mb-3"
            >
              Poste occupé
            </Label>
            <Input
              id="jobTitle"
              type="text"
              placeholder="Développeur, Designer..."
              value={jobTitle}
              onChange={(e) => onJobTitleChange(e.target.value)}
              className="h-12 text-base rounded-full px-6"
            />
          </div>

          <div>
            <Label
              htmlFor="companyName"
              className="block text-base font-semibold text-gray-800 mb-3"
            >
              Entreprise
            </Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Nom de l'entreprise"
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              className="h-12 text-base rounded-full px-6"
            />
          </div>
        </div>

        <div className="h-24" />
      </div>
    </>
  );
}
