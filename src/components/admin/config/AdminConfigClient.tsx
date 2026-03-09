"use client";
// src/components/admin/config/AdminConfigClient.tsx

import { useState } from "react";
import {
  Settings,
  User,
  Shield,
  Database,
  Bell,
  Globe,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronRight,
  Lock,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Wifi,
  AlertTriangle,
  Server,
  Zap,
  Mail,
  ToggleLeft,
  ToggleRight,
  Clock,
  Languages,
  DollarSign,
  MapPin,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConfigData {
  account: {
    adminCreated: boolean;
    id: string;
    nom: string;
    prenom: string;
    email: string;
    photo: string | null;
    role: string;
    level: string;
    provider: string;
    emailVerified: boolean;
    mustChangePassword: boolean;
    isFirstLogin: boolean;
    joinedAt: string;
    updatedAt: string;
  };
  platform: {
    name: string;
    version: string;
    environment: string;
    nextVersion: string;
    prismaVersion: string;
    region: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    language: string;
    supportEmail: string;
    legalEmail: string;
    baseUrl: string;
    supabaseConfigured: boolean;
    stripeConfigured: boolean;
    emailConfigured: boolean;
  };
}

type Tab =
  | "general"
  | "compte"
  | "securite"
  | "donnees"
  | "notifications"
  | "systeme";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrateur",
  moderator: "Modérateur",
  accountant: "Comptable",
  assistant: "Assistant",
};
const ROLE_COLORS: Record<string, string> = {
  administrator: "bg-[#0F4C5C] text-white",
  moderator: "bg-indigo-600 text-white",
  accountant: "bg-amber-600 text-white",
  assistant: "bg-gray-500 text-white",
};

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[#0F4C5C] transition-colors"
    >
      {ok ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function StatusDot({
  ok,
  labelOn,
  labelOff,
}: {
  ok: boolean;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
      ${ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {ok ? labelOn : labelOff}
    </span>
  );
}

// Toggle visuel (lecture seule — les vrais settings se font via .env / DB)
function SettingToggle({
  label,
  sub,
  enabled,
  readonly = true,
}: {
  label: string;
  sub?: string;
  enabled: boolean;
  readonly?: boolean;
}) {
  const [val, setVal] = useState(enabled);
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => !readonly && setVal(!val)}
        className={`relative flex items-center transition-colors ${readonly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        title={
          readonly
            ? "Configurable via les variables d'environnement"
            : undefined
        }
      >
        {val ? (
          <ToggleRight className="w-8 h-8 text-[#0F4C5C]" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-gray-300" />
        )}
      </button>
    </div>
  );
}

// Ligne d'info simple
function InfoLine({
  label,
  value,
  copy = false,
  badge,
}: {
  label: string;
  value: string;
  copy?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5 ml-4">
        {badge ?? (
          <span className="text-sm font-medium text-gray-800">{value}</span>
        )}
        {copy && <CopyBtn value={value} />}
      </div>
    </div>
  );
}

// Bloc card simple
function Card({
  title,
  icon: Icon,
  children,
  accent = "text-[#0F4C5C]",
  bg = "bg-[#0F4C5C]/5",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: string;
  bg?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div
          className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

// ─── Onglets ──────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "Général", icon: Settings },
  { id: "compte", label: "Compte", icon: User },
  { id: "securite", label: "Sécurité", icon: Shield },
  { id: "donnees", label: "Gestion des données", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "systeme", label: "Système", icon: Server },
];

// ═════════════════════════════════════════════════════════════════════════════
// TAB : GÉNÉRAL
// ═════════════════════════════════════════════════════════════════════════════
function TabGeneral({ p }: { p: ConfigData["platform"] }) {
  return (
    <div className="space-y-5">
      <Card
        title="Identité de l'application"
        icon={Globe}
        accent="text-blue-600"
        bg="bg-blue-50"
      >
        <InfoLine label="Nom de l'application" value={p.name} />
        <InfoLine label="URL de base" value={p.baseUrl} copy />
        <InfoLine label="Email de support" value={p.supportEmail} copy />
        <InfoLine label="Email légal" value={p.legalEmail} copy />
        <InfoLine label="Langue par défaut" value={p.language} />
      </Card>

      <Card
        title="Régionalisation"
        icon={MapPin}
        accent="text-emerald-600"
        bg="bg-emerald-50"
      >
        <InfoLine label="Région" value={p.region} />
        <InfoLine label="Fuseau horaire" value={p.timezone} />
        <InfoLine
          label="Devise par défaut"
          value={`${p.currency} (${p.currencySymbol})`}
        />
        <InfoLine label="Format monétaire" value="fr-FR" />
      </Card>

      <Card
        title="Environnement"
        icon={Zap}
        accent="text-orange-600"
        bg="bg-orange-50"
      >
        <InfoLine
          label="Mode"
          value={p.environment}
          badge={
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
              ${
                p.environment === "production"
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-orange-100 text-orange-700 border border-orange-200"
              }`}
            >
              {p.environment}
            </span>
          }
        />
        <InfoLine
          label="Version app"
          value={`v${p.version}`}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              v{p.version}
            </span>
          }
        />
        <InfoLine label="Next.js" value={p.nextVersion} />
        <InfoLine label="Prisma ORM" value={p.prismaVersion} />
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB : COMPTE
// ═════════════════════════════════════════════════════════════════════════════
function TabCompte({ a }: { a: ConfigData["account"] }) {
  const joinedDate = new Date(a.joinedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const updatedDate = new Date(a.updatedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      {/* Carte identité */}
      <div className="bg-linear-to-r from-[#0F4C5C] to-[#1a6070] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border-16 border-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl border-2 border-white/20 bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {a.photo ? (
              <img
                src={a.photo}
                alt={a.prenom}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold">
                {a.prenom[0]}
                {a.nom[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-bold text-lg">
              {a.prenom} {a.nom}
            </p>
            <p className="text-white/70 text-sm">{a.email}</p>
            <span
              className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[a.role] ?? "bg-gray-500 text-white"} bg-white/20`}
            >
              {ROLE_LABELS[a.role] ?? a.role}
            </span>
          </div>
        </div>
      </div>

      <Card title="Informations personnelles" icon={User}>
        <InfoLine label="Prénom" value={a.prenom} />
        <InfoLine label="Nom" value={a.nom} />
        <InfoLine label="Adresse email" value={a.email} copy />
        <InfoLine label="Identifiant unique" value={a.id} copy />
        <InfoLine label="Membre depuis" value={joinedDate} />
        <InfoLine label="Dernière mise à jour" value={updatedDate} />
      </Card>

      <Card
        title="Statut du compte"
        icon={CheckCircle2}
        accent="text-emerald-600"
        bg="bg-emerald-50"
      >
        <InfoLine
          label="Rôle principal"
          value={ROLE_LABELS[a.role] ?? a.role}
          badge={
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[a.role]}`}
            >
              {ROLE_LABELS[a.role] ?? a.role}
            </span>
          }
        />
        <InfoLine
          label="Niveau"
          value={a.level}
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-gray-100 text-gray-600 border border-gray-200">
              {a.level}
            </span>
          }
        />
        <InfoLine
          label="Email vérifié"
          value=""
          badge={
            <StatusDot
              ok={a.emailVerified}
              labelOn="Vérifié"
              labelOff="Non vérifié"
            />
          }
        />
        <InfoLine
          label="Méthode de connexion"
          value={
            a.provider === "google" ? "Google OAuth" : "Email / Mot de passe"
          }
        />
        <InfoLine
          label="Créé par un admin"
          value=""
          badge={<StatusDot ok={a.adminCreated} labelOn="Oui" labelOff="Non" />}
        />
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB : SÉCURITÉ
// ═════════════════════════════════════════════════════════════════════════════
function TabSecurite({ a }: { a: ConfigData["account"] }) {
  const [showId, setShowId] = useState(false);

  return (
    <div className="space-y-5">
      <Card
        title="Authentification"
        icon={Key}
        accent="text-indigo-600"
        bg="bg-indigo-50"
      >
        <InfoLine
          label="Méthode d'authentification"
          value={
            a.provider === "google"
              ? "Google OAuth 2.0"
              : "Email + mot de passe"
          }
        />
        <InfoLine
          label="Email vérifié"
          value=""
          badge={
            <StatusDot
              ok={a.emailVerified}
              labelOn="Vérifié"
              labelOff="Non vérifié"
            />
          }
        />
        <InfoLine
          label="Changement de mot de passe requis"
          value=""
          badge={
            <StatusDot
              ok={!a.mustChangePassword}
              labelOn="Non requis"
              labelOff="Requis"
            />
          }
        />
        {a.provider !== "google" && (
          <div className="py-3.5 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Mot de passe
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Modifiable depuis votre profil
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-mono">
                  {showId ? "••••••••••••" : "••••••••••••"}
                </span>
                <button
                  onClick={() => setShowId(!showId)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[#0F4C5C] transition-colors"
                >
                  {showId ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title="Autorisations & Rôle" icon={Shield}>
        <InfoLine
          label="Rôle actif"
          value={ROLE_LABELS[a.role] ?? a.role}
          badge={
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[a.role]}`}
            >
              {ROLE_LABELS[a.role] ?? a.role}
            </span>
          }
        />
        <div className="py-3 border-b border-gray-50">
          <p className="text-sm text-gray-500 mb-3">
            Permissions associées à ce rôle
          </p>
          <div className="flex flex-wrap gap-2">
            {a.role === "administrator" &&
              [
                "dashboard.view",
                "user.read",
                "user.create",
                "user.list",
                "statistics.view",
                "reports.view",
                "media.moderate",
                "notifications.view",
              ].map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 bg-[#0F4C5C]/5 text-[#0F4C5C] rounded text-xs font-mono border border-[#0F4C5C]/10"
                >
                  {p}
                </span>
              ))}
            {a.role === "moderator" &&
              [
                "media.moderate",
                "reports.view",
                "user.read",
                "notifications.view",
              ].map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono border border-indigo-100"
                >
                  {p}
                </span>
              ))}
            {a.role === "accountant" &&
              ["statistics.view", "reports.view", "notifications.view"].map(
                (p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-mono border border-amber-100"
                  >
                    {p}
                  </span>
                ),
              )}
            {a.role === "assistant" &&
              ["dashboard.view", "user.read"].map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs font-mono border border-gray-200"
                >
                  {p}
                </span>
              ))}
          </div>
        </div>
      </Card>

      <Card
        title="Sessions & Accès"
        icon={Monitor}
        accent="text-purple-600"
        bg="bg-purple-50"
      >
        <SettingToggle
          label="Authentification à deux facteurs (2FA)"
          sub="Ajoute une couche de sécurité supplémentaire à la connexion"
          enabled={false}
          readonly
        />
        <SettingToggle
          label="Déconnexion automatique après inactivité"
          sub="Session expirée après 30 minutes sans activité"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Alertes de connexion par email"
          sub="Notification à chaque nouvelle connexion détectée"
          enabled={true}
          readonly
        />
        <div className="py-3 text-xs text-gray-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Ces paramètres sont gérés au niveau de l'infrastructure.
        </div>
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB : GESTION DES DONNÉES
// ═════════════════════════════════════════════════════════════════════════════
function TabDonnees() {
  return (
    <div className="space-y-5">
      <Card
        title="Conservation des données"
        icon={Database}
        accent="text-blue-600"
        bg="bg-blue-50"
      >
        <InfoLine label="Durée de rétention des logs" value="90 jours" />
        <InfoLine
          label="Durée de rétention des notifications lues"
          value="30 jours"
        />
        <InfoLine
          label="Purge automatique des sessions expirées"
          value="Quotidienne (00h00)"
        />
        <InfoLine
          label="Sauvegarde automatique"
          value="Toutes les 24h (Supabase)"
        />
        <InfoLine
          label="Politique RGPD"
          value="Conforme"
          badge={
            <StatusDot ok={true} labelOn="Conforme" labelOff="Non conforme" />
          }
        />
      </Card>

      <Card
        title="Politique de confidentialité"
        icon={Lock}
        accent="text-emerald-600"
        bg="bg-emerald-50"
      >
        <SettingToggle
          label="Collecte des données analytiques"
          sub="Statistiques d'usage anonymisées pour améliorer la plateforme"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Logs d'activité admin"
          sub="Enregistrement des actions réalisées dans le panel"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Chiffrement des messages"
          sub="Messages chiffrés en transit et au repos (AES-256)"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Anonymisation à la suppression"
          sub="Données utilisateur anonymisées lors de la suppression de compte"
          enabled={true}
          readonly
        />
      </Card>

      <Card
        title="Exports & Sauvegardes"
        icon={Database}
        accent="text-purple-600"
        bg="bg-purple-50"
      >
        <div className="py-4 space-y-3">
          {[
            {
              label: "Exporter les utilisateurs (.csv)",
              sub: "Liste complète des membres inscrits",
            },
            {
              label: "Exporter les abonnements (.csv)",
              sub: "Historique des souscriptions",
            },
            {
              label: "Exporter les signalements (.csv)",
              sub: "Tous les reports avec statut",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-[#0F4C5C]/30 hover:bg-[#0F4C5C]/2 transition-all group"
            >
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-[#0F4C5C]">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-[#0F4C5C] font-medium flex items-center gap-1">
                Export <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Fonctionnalité d'export à implémenter via une route dédiée.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB : NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════
function TabNotifications() {
  return (
    <div className="space-y-5">
      <Card title="Notifications admin" icon={Bell}>
        <SettingToggle
          label="Nouvel utilisateur inscrit"
          sub="Recevoir une notification à chaque nouvelle inscription"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Nouveau compte staff créé"
          sub="Notifier lors de la création d'un compte administrateur"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Nouveau signalement"
          sub="Alerte immédiate lors d'un signalement soumis"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Nouvel abonnement souscrit"
          sub="Notification à chaque souscription Premium ou Club LWB"
          enabled={true}
          readonly
        />
      </Card>

      <Card
        title="Canal de diffusion"
        icon={Mail}
        accent="text-blue-600"
        bg="bg-blue-50"
      >
        <SettingToggle
          label="Notifications in-app"
          sub="Centre de notifications dans le panel admin"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Notifications par email"
          sub="Résumé quotidien ou alertes critiques par email"
          enabled={false}
          readonly
        />
        <SettingToggle
          label="Notifications push navigateur"
          sub="Alertes push dans le navigateur (Web Push API)"
          enabled={false}
          readonly
        />
        <div className="py-3 text-xs text-gray-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Les canaux email et push sont prévus pour une prochaine version.
        </div>
      </Card>

      <Card
        title="Fréquence & Regroupement"
        icon={Clock}
        accent="text-purple-600"
        bg="bg-purple-50"
      >
        <InfoLine
          label="Polling des notifications"
          value="Toutes les 60 secondes"
        />
        <InfoLine
          label="Regroupement des notifications similaires"
          value="5 minutes"
        />
        <InfoLine label="Rétention des notifications lues" value="30 jours" />
        <InfoLine label="Nettoyage automatique" value="Quotidien (cron job)" />
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB : SYSTÈME
// ═════════════════════════════════════════════════════════════════════════════
function TabSysteme({ p }: { p: ConfigData["platform"] }) {
  return (
    <div className="space-y-5">
      <Card
        title="Services connectés"
        icon={Wifi}
        accent="text-emerald-600"
        bg="bg-emerald-50"
      >
        <div className="space-y-1 py-1">
          {[
            {
              label: "Supabase Auth & Storage",
              ok: p.supabaseConfigured,
              detail: "Authentification + stockage fichiers",
            },
            {
              label: "Stripe Payments",
              ok: p.stripeConfigured,
              detail: "Gestion des abonnements et paiements",
            },
            {
              label: "Service Email (Resend)",
              ok: p.emailConfigured,
              detail: "Envoi des emails transactionnels",
            },
            {
              label: "Base de données PostgreSQL",
              ok: true,
              detail: "Via Prisma ORM + PrismaPg adapter",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-500">{s.detail}</p>
              </div>
              <StatusDot
                ok={s.ok}
                labelOn="Connecté"
                labelOff="Non configuré"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Stack technique"
        icon={Server}
        accent="text-indigo-600"
        bg="bg-indigo-50"
      >
        <InfoLine label="Framework" value="Next.js 16 (App Router)" />
        <InfoLine label="Runtime" value="Node.js / Edge Runtime" />
        <InfoLine label="ORM" value={`Prisma ${p.prismaVersion}`} />
        <InfoLine label="Base de données" value="PostgreSQL (Supabase)" />
        <InfoLine label="Auth provider" value="Supabase Auth" />
        <InfoLine label="Paiements" value="Stripe" />
        <InfoLine label="Emails" value="Resend" />
        <InfoLine label="UI" value="Tailwind CSS 4 + Lucide React" />
      </Card>

      <Card
        title="Performance & Cache"
        icon={Zap}
        accent="text-orange-600"
        bg="bg-orange-50"
      >
        <SettingToggle
          label="Cache des routes API"
          sub="Mise en cache des réponses pour les routes statiques"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Optimisation des images (Next/Image)"
          sub="Compression et redimensionnement automatique des images"
          enabled={true}
          readonly
        />
        <SettingToggle
          label="Lazy loading des composants"
          sub="Chargement différé des composants lourds"
          enabled={true}
          readonly
        />
        <InfoLine label="Région de déploiement" value={p.region} />
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminConfigClient({ data }: { data: ConfigData }) {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  return (
    <div className="p-6 max-w-5xl">
      {/* ── Onglets ── */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeTab === id
                  ? "bg-white text-[#0F4C5C] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      {activeTab === "general" && <TabGeneral p={data.platform} />}
      {activeTab === "compte" && <TabCompte a={data.account} />}
      {activeTab === "securite" && <TabSecurite a={data.account} />}
      {activeTab === "donnees" && <TabDonnees />}
      {activeTab === "notifications" && <TabNotifications />}
      {activeTab === "systeme" && <TabSysteme p={data.platform} />}
    </div>
  );
}
