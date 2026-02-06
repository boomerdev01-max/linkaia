"use client";

import { InterestCategory } from "@/components/ModalSteps/types";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface InterestsStepProps {
  selectedInterestIds: string[];
  interestCategories: InterestCategory[];
  onInterestsChange: (ids: string[]) => void;
}

export default function InterestsStep({
  selectedInterestIds,
  interestCategories,
  onInterestsChange,
}: InterestsStepProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    interestCategories.slice(0, 2).map((cat) => cat.id) // Expand first 2 by default
  );

  const MAX_INTERESTS = 10;
  const remainingSlots = MAX_INTERESTS - selectedInterestIds.length;

  const toggleInterest = (interestId: string) => {
    if (selectedInterestIds.includes(interestId)) {
      // Remove
      onInterestsChange(selectedInterestIds.filter((id) => id !== interestId));
    } else {
      // Add (if under limit)
      if (selectedInterestIds.length < MAX_INTERESTS) {
        onInterestsChange([...selectedInterestIds, interestId]);
      }
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter((id) => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  return (
    <>
      {/* Hero Image - Interests */}
      <div className="relative h-[343px] w-full bg-gradient-to-br from-accent via-secondary/50 to-primary overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-8">
            {/* Illustration abstraite style Badoo - Intérêts */}
            <div className="relative w-full h-full max-w-md">
              {/* Emojis flottants */}
              <div className="text-6xl absolute top-8 left-8 animate-bounce">🎨</div>
              <div className="text-5xl absolute top-16 right-12 animate-pulse">🎵</div>
              <div className="text-6xl absolute bottom-20 left-16 animate-bounce" style={{ animationDelay: "0.3s" }}>⚽</div>
              <div className="text-5xl absolute bottom-12 right-8 animate-pulse" style={{ animationDelay: "0.5s" }}>✈️</div>
              <div className="text-4xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" style={{ animationDelay: "0.7s" }}>💪</div>

              {/* Formes décoratives */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/30 rounded-full blur-2xl" />
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondary/30 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 pt-[22px] pb-10">
        <div className="mb-4">
          <h2 className="text-[19px] leading-tight font-bold text-primary-dark mb-2">
            Vos centres d'intérêt
          </h2>
          <p className="text-sm text-gray-600">
            Sélectionnez jusqu'à {MAX_INTERESTS} centres d'intérêt{" "}
            <span className="font-semibold text-primary">
              ({remainingSlots} {remainingSlots > 1 ? "restants" : "restant"})
            </span>
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {interestCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const selectedCount = category.interests.filter((interest) =>
              selectedInterestIds.includes(interest.id)
            ).length;

            return (
              <div key={category.id} className="border-b border-gray-200 pb-4">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-base font-semibold text-gray-800">
                      {category.name}
                    </span>
                    {selectedCount > 0 && (
                      <span className="text-xs bg-primary text-white rounded-full px-2 py-0.5">
                        {selectedCount}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* Interests */}
                {isExpanded && (
                  <div className="flex flex-wrap gap-2 mt-3 px-2">
                    {category.interests.map((interest) => {
                      const isSelected = selectedInterestIds.includes(interest.id);
                      const isDisabled = !isSelected && remainingSlots === 0;

                      return (
                        <button
                          key={interest.id}
                          onClick={() => !isDisabled && toggleInterest(interest.id)}
                          disabled={isDisabled}
                          className={`
                            flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                            transition-all duration-200 border-2
                            ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-md"
                                : isDisabled
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                                : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:bg-primary/5"
                            }
                          `}
                        >
                          <span className="text-base">{interest.emoji}</span>
                          <span>{interest.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </div>
    </>
  );
}