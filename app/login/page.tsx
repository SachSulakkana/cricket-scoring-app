import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
