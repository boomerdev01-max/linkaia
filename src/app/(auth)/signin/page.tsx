// app/(auth)/signin/page.tsx
import SigninForm from "@/components/auth/SigninForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte",
};

export default function SigninPage() {
  return <SigninForm />;
}
