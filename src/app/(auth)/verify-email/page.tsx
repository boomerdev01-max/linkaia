// app/(auth)/verify-email/page.tsx
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification de l'email",
  description: "Vérifiez votre adresse email",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
