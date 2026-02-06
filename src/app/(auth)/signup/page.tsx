// app/(auth)/signup/page.tsx
import SignupForm from "@/components/auth/SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Inscrivez vous sur Linkaia",
};

export default function SignupPage() {
  return <SignupForm />;
}
