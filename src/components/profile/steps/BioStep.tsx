import { Label } from "@/components/ui/label";

interface BioStepProps {
  bio: string;
  onBioChange: (value: string) => void;
}

const MAX_CHARS = 500;

export default function BioStep({ bio, onBioChange }: BioStepProps) {
  const remainingChars = MAX_CHARS - bio.length;

  return (
    <>
      {/* Hero Image - Bio */}
      <div className="relative h-[343px] w-full bg-gradient-to-br from-primary via-accent/50 to-secondary overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Illustration abstraite style Badoo - Bio/Écriture */}
            <div className="relative w-full h-full max-w-md">
              {/* Feuille de papier */}
              <div className="absolute left-1/4 top-1/4 w-64 h-72 bg-white rounded-lg shadow-2xl transform -rotate-3">
                {/* Lignes d'écriture */}
                <div className="p-6 space-y-4">
                  <div className="h-2 bg-primary/30 rounded-full w-full" />
                  <div className="h-2 bg-primary/20 rounded-full w-5/6" />
                  <div className="h-2 bg-primary/30 rounded-full w-full" />
                  <div className="h-2 bg-primary/20 rounded-full w-4/5" />
                  <div className="h-2 bg-primary/30 rounded-full w-full" />
                  <div className="h-2 bg-primary/20 rounded-full w-3/4" />
                </div>
              </div>

              {/* Stylo */}
              <div className="absolute right-8 bottom-16 w-32 h-8 bg-accent rounded-full transform rotate-45 shadow-lg" />

              {/* Emoji écriture */}
              <div className="absolute top-8 right-4 text-6xl animate-bounce">✍️</div>

              {/* Formes décoratives */}
              <div className="absolute bottom-8 left-8 w-16 h-16 bg-secondary/60 rounded-full" />
              <div className="absolute top-12 left-4 w-12 h-12 bg-primary/40 rounded-[20px] transform rotate-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-[22px] pb-10">
        <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
          Parlez-nous un peu de vous
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Écrivez une courte présentation qui vous représente
        </p>

        <div>
          <Label htmlFor="bio" className="block text-base font-semibold text-gray-800 mb-3">
            Biographie
          </Label>
          <div className="relative">
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  onBioChange(e.target.value);
                }
              }}
              placeholder="Exemple : Passionné(e) de voyages et de cuisine, j'aime découvrir de nouvelles cultures et partager de bons moments autour d'un repas..."
              className="w-full h-48 px-6 py-4 text-base border-2 border-gray-200 rounded-2xl resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              maxLength={MAX_CHARS}
            />
            
            {/* Character counter */}
            <div
              className={`absolute bottom-4 right-4 text-sm font-medium ${
                remainingChars < 50
                  ? "text-red-500"
                  : remainingChars < 100
                  ? "text-orange-500"
                  : "text-gray-500"
              }`}
            >
              {bio.length}/{MAX_CHARS}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-primary">💡 Conseil :</span> Partagez vos passions, ce qui vous rend unique, ou ce que vous recherchez. Restez authentique !
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </div>
    </>
  );
}