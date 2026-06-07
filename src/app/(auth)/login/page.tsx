import type { Metadata } from "next";
import { SignInForm } from "@/modules/auth/presentation/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Adapted Books account.",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to continue creating accessible stories.
      </p>
      <div className="mt-6">
        <SignInForm />
      </div>
    </div>
  );
}
