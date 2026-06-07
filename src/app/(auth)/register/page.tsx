import type { Metadata } from "next";
import { SignUpForm } from "@/modules/auth/presentation/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create your organization",
  description: "Start using Adapted Books for your school, therapy center, or family.",
};

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Create your organization</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You'll automatically become its first owner.
      </p>
      <div className="mt-6">
        <SignUpForm />
      </div>
    </div>
  );
}
