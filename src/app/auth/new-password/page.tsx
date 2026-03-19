import NewPasswordForm from "@/components/auth/new-password-form";
import { Suspense } from "react";

export default function NewPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-950 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,#e4e4e7_0%,transparent_70%)] opacity-50" />

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-3xl p-8 shadow-xl relative z-10">
                <Suspense fallback={<div className="text-center text-zinc-500">Aguarde...</div>}>
                    <NewPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
