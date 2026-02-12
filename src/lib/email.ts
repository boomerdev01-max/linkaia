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
  nom: string
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
  nom: string
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

// Générer un code à 6 chiffres
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
