// app/(auth)/reset-password/page.tsx
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Réinitialisez votre mot de passe",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
