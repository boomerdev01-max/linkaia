// app/(auth)/forgot-password/page.tsx
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Changez votre mot de passe",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
