import { Check } from "lucide-react";
import { GENDER_OPTIONS } from "../types";

interface GenderAgeStepProps {
  selectedGenderCodes: string[];
  ageMin: number;
  ageMax: number;
  onGenderCodesChange: (codes: string[]) => void;
  onAgeMinChange: (value: number) => void;
  onAgeMaxChange: (value: number) => void;
}

export default function GenderAgeStep({
  selectedGenderCodes,
  ageMin,
  ageMax,
  onGenderCodesChange,
  onAgeMinChange,
  onAgeMaxChange,
}: GenderAgeStepProps) {
  const handleToggleGender = (code: string) => {
    if (selectedGenderCodes.includes(code)) {
      onGenderCodesChange(selectedGenderCodes.filter((c) => c !== code));
    } else {
      onGenderCodesChange([...selectedGenderCodes, code]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 font-sans selection:bg-purple-500/30">
      {/* Decorative Header */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-3xl">
         {/* Minimal abstract Badoo/Bumble style header */}
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
         <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
         <div className="absolute bottom-[-30%] right-[-10%] w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" style={{ animationDelay: '1s' }} />
         
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-24 h-24 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-[2rem] border border-white/60 dark:border-zinc-800/60 shadow-xl flex items-center justify-center transform -rotate-3">
               <span className="text-4xl">👫</span>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center border border-gray-100 dark:border-zinc-700">
                  <span className="text-xl">✨</span>
               </div>
            </div>
         </div>
      </div>

      {/* Form Content */}
      <div className="px-6 sm:px-10 pt-8 pb-32 overflow-y-auto scrollbar-hide space-y-12">
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Genre recherché
            </h2>
            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 px-3 py-1 rounded-full">
              {selectedGenderCodes.length === 0 ? "Aucun" : `${selectedGenderCodes.length} choix`}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Sélectionnez le(s) genre(s) qui vous intéressent.</p>

          <div className="grid grid-cols-1 gap-3">
            {GENDER_OPTIONS.map((option) => {
              const isSelected = selectedGenderCodes.includes(option.code);

              return (
                <div
                  key={option.code}
                  onClick={() => handleToggleGender(option.code)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleGender(option.code);
                    }
                  }}
                  className={`group relative flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none ${
                    isSelected
                      ? "bg-purple-50 dark:bg-purple-500/10 border-purple-500 dark:border-purple-500 shadow-sm shadow-purple-500/10"
                      : "bg-white dark:bg-zinc-950 border-gray-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-900/50 hover:bg-gray-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-sm">{option.emoji}</span>
                    <span className={`text-[15px] font-semibold transition-colors ${isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"}`}>
                      {option.label}
                    </span>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected 
                      ? "bg-purple-500 scale-110" 
                      : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 group-hover:border-purple-300 dark:group-hover:border-purple-800"
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-100 dark:border-zinc-800" />

        {/* Age Range */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Âge recherché
            </h2>
            <span className="text-xs font-bold text-pink-500 uppercase tracking-wider bg-pink-50 dark:bg-pink-500/10 px-3 py-1 rounded-full">
              {ageMin} - {ageMax} ans
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Affinez votre recherche par âge.</p>

          <div className="space-y-8">
            {/* Age Min */}
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">Âge minimum</span>
                <span className="text-lg font-bold text-pink-500">{ageMin} ans</span>
              </div>
              <input
                type="range"
                min="18"
                max="100"
                value={ageMin}
                onChange={(e) => onAgeMinChange(parseInt(e.target.value))}
                className="w-full h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer outline-hidden focus:ring-2 focus:ring-pink-500/20"
                style={{
                  background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${
                    ((ageMin - 18) / 82) * 100
                  }%, transparent ${((ageMin - 18) / 82) * 100}%, transparent 100%)`,
                }}
              />
            </div>

            {/* Age Max */}
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">Âge maximum</span>
                <span className="text-lg font-bold text-pink-500">{ageMax} ans</span>
              </div>
              <input
                type="range"
                min="18"
                max="100"
                value={ageMax}
                onChange={(e) => onAgeMaxChange(parseInt(e.target.value))}
                className="w-full h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer outline-hidden focus:ring-2 focus:ring-pink-500/20"
                style={{
                  background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${
                    ((ageMax - 18) / 82) * 100
                  }%, transparent ${((ageMax - 18) / 82) * 100}%, transparent 100%)`,
                }}
              />
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
          border: 4px solid white;
          transition: transform 0.1s;
        }

        @media (prefers-color-scheme: dark) {
          input[type="range"]::-webkit-slider-thumb {
            border: 4px solid #18181b; /* zinc-950 */
          }
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ec4899;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
          border: 4px solid white;
          transition: transform 0.1s;
        }

        @media (prefers-color-scheme: dark) {
          input[type="range"]::-moz-range-thumb {
            border: 4px solid #18181b;
          }
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
