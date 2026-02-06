// app/user/[id]/UserProfileView.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MessageCircle, UserPlus, MoreHorizontal,
  MapPin, Briefcase, GraduationCap, Heart, Calendar,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileViewProps {
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    profil: {
      pseudo: string | null;
      profilePhotoUrl: string | null;
      bio: string | null;
      birthdate: Date | null;
      gender: string | null;
      sexualOrientation: string | null;
      relationshipStatus: string | null;
      height: number | null;
      weight: number | null;
      skinTone: string | null;
      educationLevel: string | null;
      studyPlace: string | null;
      jobTitle: string | null;
      companyName: string | null;
      countryOrigin: string | null;
      countryResidence: string | null;
      location: string | null;
      smoker: string | null;
      alcohol: string | null;
      hasChildren: string | null;
      wantsChildren: string | null;
      hasPets: string | null;
      personalityType: string | null;
      zodiacSign: string | null;
      religion: string | null;
      loveAnimals: string | null;
      interests: {
        interest: {
          name: string;
          emoji: string;
          category: {
            name: string;
          };
        };
      }[];
      nationalites: {
        nationality: {
          nameFr: string;
          flag: string;
        };
      }[];
    } | null;
  };
  currentUserId: string;
}

export function UserProfileView({ user, currentUserId }: UserProfileViewProps) {
  const router = useRouter();
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  const profile = user.profil;
  const displayName = profile?.pseudo || `${user.prenom} ${user.nom}`;

  const calculateAge = (birthdate: Date | null) => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleStartConversation = async () => {
    setIsStartingConversation(true);
    
    try {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur');
      }

      const data = await response.json();
      
      // Navigate to chat with this conversation
      router.push(`/chat?conversation=${data.conversation.id}`);
    } catch (error) {
      toast.error('Impossible de demarrer la conversation');
    } finally {
      setIsStartingConversation(false);
    }
  };

  const age = calculateAge(profile?.birthdate || null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0F4C5C] text-white px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold">Profil</h1>
      </header>

      {/* Profile content */}
      <div className="max-w-2xl mx-auto pb-8">
        {/* Cover & Avatar */}
        <div className="relative">
          <div className="h-32 bg-linear-to-r from-[#0F4C5C] to-[#B88A4F]" />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-16">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-[#0F4C5C] overflow-hidden shadow-lg">
              {profile?.profilePhotoUrl ? (
                <img
                  src={profile.profilePhotoUrl || "/placeholder.svg"}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {user.prenom.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-20 px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {displayName}
            {age && <span className="text-gray-500 font-normal">, {age}</span>}
          </h2>
          
          {profile?.pseudo && (
            <p className="text-gray-500">@{profile.pseudo}</p>
          )}

          {profile?.location && (
            <p className="flex items-center justify-center gap-1 text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              {profile.location}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleStartConversation}
              disabled={isStartingConversation}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0F4C5C] text-white rounded-full font-medium hover:bg-[#0F4C5C]/90 transition-colors disabled:opacity-50"
            >
              {isStartingConversation ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              Message
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#B88A4F] text-white rounded-full font-medium hover:bg-[#B88A4F]/90 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter
            </button>
            <button
              type="button"
              className="p-2.5 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="mx-4 mt-6 p-4 bg-white rounded-xl shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">A propos</h3>
            <p className="text-gray-600">{profile.bio}</p>
          </div>
        )}

        {/* Details */}
        <div className="mx-4 mt-4 p-4 bg-white rounded-xl shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Informations</h3>
          
          {profile?.jobTitle && (
            <div className="flex items-center gap-3 text-gray-600">
              <Briefcase className="w-5 h-5 text-[#B88A4F]" />
              <span>
                {profile.jobTitle}
                {profile.companyName && ` chez ${profile.companyName}`}
              </span>
            </div>
          )}

          {profile?.educationLevel && (
            <div className="flex items-center gap-3 text-gray-600">
              <GraduationCap className="w-5 h-5 text-[#B88A4F]" />
              <span>
                {profile.educationLevel}
                {profile.studyPlace && ` - ${profile.studyPlace}`}
              </span>
            </div>
          )}

          {profile?.relationshipStatus && profile.relationshipStatus !== 'PREFER_NOT_TO_SAY' && (
            <div className="flex items-center gap-3 text-gray-600">
              <Heart className="w-5 h-5 text-[#B88A4F]" />
              <span>{profile.relationshipStatus}</span>
            </div>
          )}

          {profile?.nationalites && profile.nationalites.length > 0 && (
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-xl">{profile.nationalites[0].nationality.flag}</span>
              <span>
                {profile.nationalites.map(n => n.nationality.nameFr).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <div className="mx-4 mt-4 p-4 bg-white rounded-xl shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Centres d'interet</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((pi, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  <span>{pi.interest.emoji}</span>
                  {pi.interest.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
