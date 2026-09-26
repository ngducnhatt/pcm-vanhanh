import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { SURFACE_CARD } from "@/lib/ui";

export const metadata = {
  title: 'Đăng nhập | PCM Vận Hành',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Suspense
        fallback={
          <div
            className={`${SURFACE_CARD} h-80 w-full max-w-sm animate-pulse`}
            aria-hidden="true"
          />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
