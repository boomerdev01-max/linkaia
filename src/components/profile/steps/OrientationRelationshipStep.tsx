import { Option } from "@/components/ModalSteps/types";
import { Check } from "lucide-react";

interface OrientationRelationshipStepProps {
  sexualOrientation: string;
  relationshipStatus: string;
  onOrientationChange: (value: string) => void;
  onRelationshipChange: (value: string) => void;
}

const orientationOptions: Option[] = [
  { id: "hetero", label: "Hétéro" },
  { id: "gay", label: "Gay" },
  { id: "lesbian", label: "Lesbienne" },
  { id: "bi", label: "Bisexuel(le)" },
  { id: "asexual", label: "Asexuel(le)" },
  { id: "demi", label: "Demisexuel(le)" },
  { id: "pan", label: "Pansexuel(le)" },
  { id: "queer", label: "Queer" },
  { id: "questioning", label: "Je me cherche" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

const relationshipOptions: Option[] = [
  { id: "single", label: "Célibataire" },
  { id: "couple", label: "En couple" },
  { id: "complicated", label: "C'est compliqué" },
  { id: "open", label: "En relation libre" },
  { id: "PREFER_NOT_TO_SAY", label: "Je préfère ne pas le dire" },
];

export default function OrientationRelationshipStep({
  sexualOrientation,
  relationshipStatus,
  onOrientationChange,
  onRelationshipChange,
}: OrientationRelationshipStepProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 font-sans selection:bg-pink-500/30">
      
      {/* Decorative Header */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-t-3xl">
         {/* Minimal abstract Badoo/Bumble style header */}
         <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-orange-500/10" />
         <div className="absolute top-[-50%] right-[-20%] w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
         <div className="absolute bottom-[-30%] left-[-10%] w-48 h-48 bg-orange-500/20 rounded-full blur-3xl" />
         
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-24 h-24 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-[2rem] border border-white/60 dark:border-zinc-800/60 shadow-xl flex items-center justify-center transform rotate-3">
               <span className="text-4xl">🏳️‍🌈</span>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center border border-gray-100 dark:border-zinc-700">
                  <span className="text-xl">❤️</span>
               </div>
            </div>
         </div>
      </div>

      {/* Form Content */}
      <div className="px-6 sm:px-10 pt-8 pb-32 overflow-y-auto scrollbar-hide space-y-12">
        
        {/* Orientation sexuelle */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            Quelle est votre orientation sexuelle ?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Sélectionnez ce qui vous correspond le mieux.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orientationOptions.map((option) => {
              const isActive = sexualOrientation === option.id;
              
              return (
                <div
                  key={option.id}
                  className={`group relative flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none ${
                    isActive
                      ? "bg-pink-50 dark:bg-pink-500/10 border-pink-500 dark:border-pink-500 shadow-sm shadow-pink-500/10"
                      : "bg-white dark:bg-zinc-950 border-gray-100 dark:border-zinc-800 hover:border-pink-200 dark:hover:border-pink-900/50 hover:bg-gray-50 dark:hover:bg-zinc-900"
                  }`}
                  onClick={() => onOrientationChange(option.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOrientationChange(option.id);
                    }
                  }}
                >
                  <span className={`text-[15px] font-semibold transition-colors ${isActive ? "text-pink-600 dark:text-pink-400" : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"}`}>
                    {option.label}
                  </span>
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? "bg-pink-500 scale-110" 
                      : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 group-hover:border-pink-300 dark:group-hover:border-pink-800"
                  }`}>
                    {isActive && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Divider */}
        <hr className="border-gray-100 dark:border-zinc-800" />

        {/* Situation amoureuse */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            Quelle est votre situation amoureuse ?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Pour des rencontres plus transparentes.</p>

          <div className="grid grid-cols-1 gap-3">
            {relationshipOptions.map((option) => {
              const isActive = relationshipStatus === option.id;

              return (
                <div
                  key={option.id}
                  className={`group relative flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none ${
                    isActive
                      ? "bg-pink-50 dark:bg-pink-500/10 border-pink-500 dark:border-pink-500 shadow-sm shadow-pink-500/10"
                      : "bg-white dark:bg-zinc-950 border-gray-100 dark:border-zinc-800 hover:border-pink-200 dark:hover:border-pink-900/50 hover:bg-gray-50 dark:hover:bg-zinc-900"
                  }`}
                  onClick={() => onRelationshipChange(option.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRelationshipChange(option.id);
                    }
                  }}
                >
                  <span className={`text-[15px] font-semibold transition-colors ${isActive ? "text-pink-600 dark:text-pink-400" : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"}`}>
                    {option.label}
                  </span>
                  
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? "bg-pink-500 scale-110" 
                      : "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 group-hover:border-pink-300 dark:group-hover:border-pink-800"
                  }`}>
                    {isActive && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}