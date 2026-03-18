import NewPasswordForm from "@/components/auth/new-password-form";
import { Suspense } from "react";

export default function NewPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,#062d1e_0%,transparent_70%)] opacity-50" />

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10">
                <Suspense fallback={<div className="text-center text-zinc-500">Aguarde...</div>}>
                    <NewPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
