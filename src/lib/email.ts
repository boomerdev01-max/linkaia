import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  email: string,
  code: string,
  nom: string,
) {
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Vérification de votre email - ${process.env.APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .code-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue sur ${process.env.APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${nom},</h2>
            <p>Merci de vous être inscrit sur <strong>${process.env.APP_NAME}</strong> !</p>
            <p>Pour finaliser votre inscription, veuillez utiliser le code de vérification ci-dessous :</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              ⏰ Ce code est valide pendant <strong>15 minutes</strong>.
            </p>
            
            <p style="margin-top: 30px;">
              Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 ${process.env.APP_NAME}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(
  email: string,
  code: string,
  nom: string,
) {
  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Réinitialisation de votre mot de passe - ${process.env.APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .code-box { background: #fff5f5; border: 2px dashed #f5576c; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 8px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Réinitialisation du mot de passe</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${nom},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe sur <strong>${process.env.APP_NAME}</strong>.</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              ⏰ Ce code est valide pendant <strong>15 minutes</strong>.
            </p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong> Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            </div>
          </div>
          <div class="footer">
            <p>© 2026 ${process.env.APP_NAME}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ============================================
// ADMIN — Génération de mot de passe sécurisé
// ============================================

/**
 * Génère un mot de passe robuste de 12 caractères.
 * Garantit : 2 majuscules, 2 chiffres, 2 symboles, 6 minuscules — mélangés.
 * L'admin ne voit JAMAIS ce mot de passe.
 * Il est généré côté serveur et transmis uniquement par email à l'utilisateur.
 */
export function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$%&*!?";

  const pick = (chars: string) =>
    chars[Math.floor(Math.random() * chars.length)];

  const parts = [
    pick(upper),
    pick(upper),
    pick(digits),
    pick(digits),
    pick(symbols),
    pick(symbols),
    ...Array.from({ length: 6 }, () => pick(lower)),
  ];

  // Mélange aléatoire des 12 caractères
  return parts.sort(() => Math.random() - 0.5).join("");
}

// ============================================
// EMAIL : ADMIN → Création d'un compte utilisateur
// ============================================

/**
 * Envoie les identifiants de connexion à un utilisateur créé par l'admin.
 * mustChangePassword est toujours true → l'utilisateur change son mdp dès la 1ère co.
 */
export async function sendAdminCreatedUserEmail(
  email: string,
  password: string,
  nom: string,
  prenom: string,
  role: string,
) {
  const roleLabels: Record<string, string> = {
    administrator: "Administrateur",
    moderator: "Modérateur",
    accountant: "Comptable",
    assistant: "Assistant",
    standard_user: "Utilisateur",
    company_user: "Entreprise",
  };

  const roleLabel = roleLabels[role] ?? role;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  const mailOptions = {
    from: `"${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Bienvenue sur ${process.env.APP_NAME} — Vos identifiants de connexion`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
          .wrap { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 30px rgba(0,0,0,0.11); }
          .header { background: linear-gradient(135deg, #0F4C5C 0%, #B88A4F 100%); padding: 38px 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0 0 6px; font-size: 22px; font-weight: 700; }
          .header p  { color: rgba(255,255,255,0.80); margin: 0; font-size: 13px; }
          .body { padding: 40px 36px; }
          .greeting { font-size: 16px; color: #1f2937; margin: 0 0 10px; }
          .intro { color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 28px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 26px; margin-bottom: 24px; }
          .box-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: #64748b; margin: 0 0 20px; }
          .row { display: flex; gap: 14px; align-items: flex-start; padding: 13px 0; border-bottom: 1px solid #edf2f7; }
          .row:last-child { border-bottom: none; padding-bottom: 0; }
          .ico { font-size: 18px; width: 26px; text-align: center; flex-shrink: 0; }
          .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin-bottom: 5px; }
          .val { font-size: 15px; color: #1e293b; font-weight: 600; word-break: break-all; }
          .pwd { font-family: 'Courier New', monospace; background: #1e293b; color: #f1f5f9; padding: 9px 14px; border-radius: 6px; font-size: 15px; letter-spacing: .12em; display: inline-block; margin-top: 4px; }
          .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
          .alert { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px 18px; display: flex; gap: 12px; margin-bottom: 30px; }
          .alert p { font-size: 13px; color: #92400e; line-height: 1.55; margin: 0; }
          .alert p strong { display: block; color: #78350f; margin-bottom: 3px; }
          .cta { text-align: center; }
          .btn { display: inline-block; background: linear-gradient(135deg,#0F4C5C 0%,#0a3542 100%); color: #fff !important; text-decoration: none; padding: 14px 42px; border-radius: 8px; font-size: 15px; font-weight: 700; }
          .footer { background: #f8f9fa; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="header">
            <h1>🎉 Votre compte a été créé</h1>
            <p>${process.env.APP_NAME} · Accès administrateur</p>
          </div>
          <div class="body">
            <p class="greeting">Bonjour <strong>${prenom} ${nom}</strong>,</p>
            <p class="intro">
              Un administrateur vient de créer votre compte sur
              <strong>${process.env.APP_NAME}</strong>.
              Retrouvez ci-dessous vos identifiants — conservez-les en lieu sûr.
            </p>

            <div class="box">
              <p class="box-title">🔑 Vos identifiants</p>

              <div class="row">
                <div class="ico">📧</div>
                <div>
                  <div class="lbl">Adresse email</div>
                  <div class="val">${email}</div>
                </div>
              </div>

              <div class="row">
                <div class="ico">🔐</div>
                <div>
                  <div class="lbl">Mot de passe temporaire</div>
                  <div class="pwd">${password}</div>
                </div>
              </div>

              <div class="row">
                <div class="ico">🛡️</div>
                <div>
                  <div class="lbl">Rôle assigné</div>
                  <div class="val"><span class="badge">${roleLabel}</span></div>
                </div>
              </div>
            </div>

            <div class="alert">
              <span style="font-size:18px;flex-shrink:0;">⚠️</span>
              <p>
                <strong>Changement de mot de passe requis</strong>
                Pour des raisons de sécurité, vous devrez choisir un nouveau
                mot de passe dès votre première connexion.
              </p>
            </div>

            <div class="cta">
              <a href="${appUrl}/signin" class="btn">Accéder à mon compte →</a>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 ${process.env.APP_NAME}. Tous droits réservés.</p>
            <p>Email envoyé automatiquement — merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Générer un code à 6 chiffres
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}