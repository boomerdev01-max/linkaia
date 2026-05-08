"use client";
import { useState } from "react";
import {
  ScrollText,
  Shield,
  ChevronRight,
  BookOpen,
  Lock,
  Calendar,
  Globe,
  Mail,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "cgu" | "confidentialite";

interface Section {
  title: string;
  content: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CGU_SECTIONS: Section[] = [
  {
    title: "1. Objet",
    content: [
      "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Linkaïa, accessible via le site web et les applications mobiles associées.",
      "En accédant à la plateforme, l'utilisateur accepte sans réserve les présentes conditions. Linkaïa se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés de toute modification significative par notification.",
    ],
  },
  {
    title: "2. Inscription et accès",
    content: [
      "L'accès aux services de Linkaïa nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription.",
      "L'utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toutes les actions réalisées depuis son compte. En cas de compromission, il doit en informer immédiatement Linkaïa.",
      "Linkaïa propose différents niveaux d'accès : FREE, VIP, PLATINUM et PRESTIGE. Le niveau PRESTIGE est accessible uniquement sur invitation par code.",
    ],
  },
  {
    title: "3. Utilisation de la plateforme",
    content: [
      "L'utilisateur s'engage à utiliser Linkaïa dans le respect des lois en vigueur et des droits des tiers. Il est interdit de publier du contenu diffamatoire, obscène, violent, raciste ou portant atteinte à la dignité humaine.",
      "Il est strictement interdit de créer de faux profils, d'usurper l'identité d'autrui, de harceler d'autres utilisateurs ou d'utiliser la plateforme à des fins commerciales non autorisées.",
      "Linkaïa se réserve le droit de suspendre ou supprimer tout compte qui ne respecterait pas ces règles, sans préavis ni remboursement.",
    ],
  },
  {
    title: "4. Contenu utilisateur",
    content: [
      "L'utilisateur reste propriétaire du contenu qu'il publie sur Linkaïa (photos, textes, vidéos). En le publiant, il concède à Linkaïa une licence non exclusive, mondiale et gratuite pour l'afficher sur la plateforme.",
      "L'utilisateur garantit que le contenu publié ne viole aucun droit de tiers, notamment en matière de propriété intellectuelle. Linkaïa peut modérer ou supprimer tout contenu jugé inapproprié.",
    ],
  },
  {
    title: "5. Monnaie virtuelle — L-Gems",
    content: [
      "Linkaïa propose une monnaie virtuelle dénommée L-Gems, utilisable exclusivement sur la plateforme pour l'envoi de cadeaux virtuels et l'accès à des fonctionnalités premium.",
      "Les L-Gems sont achetés via des packs disponibles sur la plateforme. Ils ne sont ni remboursables, ni échangeables contre de la monnaie réelle, sauf disposition légale contraire applicable dans le pays de l'utilisateur.",
      "Linkaïa se réserve le droit de modifier la valeur des packs et les conditions d'utilisation des L-Gems, avec notification préalable aux utilisateurs.",
    ],
  },
  {
    title: "6. Responsabilité",
    content: [
      "Linkaïa s'engage à mettre tous les moyens en œuvre pour assurer la disponibilité et la sécurité de la plateforme. Cependant, Linkaïa ne peut être tenu responsable des interruptions de service, pertes de données ou dommages résultant d'une utilisation inadéquate.",
      "Linkaïa n'est pas responsable des contenus publiés par les utilisateurs, ni des interactions entre eux. Chaque utilisateur est seul responsable de ses actes sur la plateforme.",
    ],
  },
  {
    title: "7. Abonnements et résiliation",
    content: [
      "Les abonnements payants (VIP, PLATINUM) sont facturés selon la périodicité choisie (mensuelle ou annuelle). Le renouvellement automatique peut être désactivé depuis les paramètres du compte.",
      "La résiliation d'un abonnement prend effet à la fin de la période en cours. Aucun remboursement ne sera effectué pour la période déjà payée.",
      "Linkaïa se réserve le droit de résilier un compte à tout moment en cas de violation des présentes CGU.",
    ],
  },
  {
    title: "8. Droit applicable",
    content: [
      "Les présentes CGU sont soumises au droit en vigueur dans le pays d'établissement de Linkaïa. Tout litige relatif à leur interprétation ou exécution sera soumis aux juridictions compétentes.",
      "Pour toute question relative aux présentes conditions, l'utilisateur peut contacter le service juridique de Linkaïa à l'adresse : legal@linkaia.com.",
    ],
  },
];

const PRIVACY_SECTIONS: Section[] = [
  {
    title: "1. Responsable du traitement",
    content: [
      "Linkaïa est responsable du traitement des données personnelles collectées via sa plateforme. Pour toute question relative à la protection des données, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l'adresse : dpo@linkaia.com.",
    ],
  },
  {
    title: "2. Données collectées",
    content: [
      "Lors de votre inscription et utilisation de Linkaïa, nous collectons : données d'identité (nom, prénom, email, date de naissance, genre), données de profil (photo, bio, centres d'intérêt, localisation), données de navigation et d'interaction (événements PostHog, scores de matching), données de transaction (historique d'achats de L-Gems, abonnements).",
      "Pour les utilisateurs de type Entreprise, nous collectons également : dénomination sociale, numéro d'enregistrement, représentant légal, documents d'identité de l'entreprise.",
      "Certaines données sensibles (orientation sexuelle, religion) sont collectées uniquement avec votre consentement explicite et sont utilisées exclusivement à des fins de matching.",
    ],
  },
  {
    title: "3. Finalités du traitement",
    content: [
      "Vos données sont traitées pour les finalités suivantes : gestion de votre compte et fourniture des services, amélioration de l'algorithme de matching et personnalisation du feed, traitement des paiements et gestion des abonnements, sécurité de la plateforme et prévention de la fraude, communications liées à l'utilisation du service.",
      "Nous n'utilisons pas vos données à des fins publicitaires tierces. Linkaïa products sont sans publicité.",
    ],
  },
  {
    title: "4. Base légale",
    content: [
      "Le traitement de vos données repose sur les bases légales suivantes : exécution du contrat (fourniture des services Linkaïa), consentement explicite (données sensibles, communications marketing), intérêt légitime (sécurité, prévention des fraudes, amélioration des services), obligation légale (conservation comptable, réponse aux réquisitions judiciaires).",
    ],
  },
  {
    title: "5. Partage des données",
    content: [
      "Linkaïa ne vend pas vos données personnelles à des tiers. Nous partageons vos données uniquement avec : nos sous-traitants techniques (Supabase pour l'hébergement, Stripe pour les paiements, LiveKit pour les lives), les autorités compétentes sur réquisition judiciaire.",
      "Tout sous-traitant est lié par un accord de traitement des données conforme aux exigences réglementaires applicables.",
    ],
  },
  {
    title: "6. Durée de conservation",
    content: [
      "Vos données de compte sont conservées pendant toute la durée de votre inscription et pendant 3 ans après la suppression de votre compte (obligation légale).",
      "Les données de transaction sont conservées 10 ans à compter de leur enregistrement (obligation comptable). Les données de navigation sont conservées 13 mois maximum.",
    ],
  },
  {
    title: "7. Vos droits",
    content: [
      "Conformément à la réglementation applicable, vous disposez des droits suivants sur vos données : droit d'accès, de rectification, d'effacement (droit à l'oubli), de limitation du traitement, à la portabilité, d'opposition.",
      "Pour exercer vos droits, adressez votre demande à : privacy@linkaia.com. Nous nous engageons à répondre dans un délai de 30 jours.",
      "En cas de réclamation non résolue, vous avez le droit d'introduire une réclamation auprès de l'autorité de protection des données compétente.",
    ],
  },
  {
    title: "8. Sécurité",
    content: [
      "Linkaïa met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des communications (TLS), chiffrement des messages (end-to-end), contrôle d'accès strict (RBAC), surveillance continue des accès.",
      "En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, vous serez informé dans les meilleurs délais conformément aux obligations réglementaires.",
    ],
  },
  {
    title: "9. Cookies",
    content: [
      "Linkaïa utilise des cookies techniques nécessaires au fonctionnement de la plateforme (session, authentification). Aucun cookie publicitaire tiers n'est déposé sur votre navigateur.",
      "Vous pouvez configurer votre navigateur pour refuser les cookies, sachant que cela peut impacter certaines fonctionnalités de la plateforme.",
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionBlock({ section, index }: { section: Section; index: number }) {
  const [open, setOpen] = useState(index < 2); // 2 premières ouvertes par défaut

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left gap-3"
      >
        <span className="font-semibold text-gray-800 text-sm">
          {section.title}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 py-4 space-y-3 bg-white">
          {section.content.map((paragraph, i) => (
            <p key={i} className="text-sm text-gray-600 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LegalClient() {
  const [activeTab, setActiveTab] = useState<Tab>("cgu");

  const isCGU = activeTab === "cgu";
  const sections = isCGU ? CGU_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setActiveTab("cgu")}
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border
            ${
              activeTab === "cgu"
                ? "bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-md shadow-[#0F4C5C]/20"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#0F4C5C]/40 hover:text-[#0F4C5C]"
            }`}
        >
          <BookOpen className="w-4 h-4" />
          Conditions d'utilisation
        </button>

        <button
          onClick={() => setActiveTab("confidentialite")}
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border
            ${
              activeTab === "confidentialite"
                ? "bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-md shadow-[#0F4C5C]/20"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#0F4C5C]/40 hover:text-[#0F4C5C]"
            }`}
        >
          <Shield className="w-4 h-4" />
          Politique de confidentialité
        </button>
      </div>

      {/* ── Meta card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Icon + titre */}
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
              ${isCGU ? "bg-blue-50" : "bg-emerald-50"}`}
            >
              {isCGU ? (
                <ScrollText className="w-6 h-6 text-blue-600" />
              ) : (
                <Lock className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">
                {isCGU
                  ? "Conditions Générales d'Utilisation"
                  : "Politique de Confidentialité"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isCGU
                  ? "Document régissant les droits et obligations des utilisateurs de Linkaïa"
                  : "Document décrivant la collecte et le traitement des données personnelles"}
              </p>
            </div>
          </div>

          {/* Notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 max-w-xs">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Ce document est en lecture seule. Pour toute modification, contactez l'équipe juridique.
            </span>
          </div>
        </div>

        {/* Meta infos */}
        <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetaInfo icon={Calendar} label="Dernière mise à jour" value="01 mai 2026" />
          <MetaInfo icon={Globe} label="Langue" value="Français" />
          <MetaInfo
            icon={ScrollText}
            label="Nombre de sections"
            value={`${sections.length} sections`}
          />
          <MetaInfo
            icon={Mail}
            label="Contact"
            value={isCGU ? "legal@linkaia.com" : "dpo@linkaia.com"}
          />
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {isCGU
              ? "Conditions Générales d'Utilisation — Linkaïa"
              : "Politique de Confidentialité — Linkaïa"}
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            Version 1.0
          </span>
        </div>

        <div className="p-6 space-y-3">
          {sections.map((section, i) => (
            <SectionBlock key={`${activeTab}-${i}`} section={section} index={i} />
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-gray-400 text-center pb-2">
        Powered by Linkaia
      </p>
    </div>
  );
}