import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import LoginForm from "@/components/auth/login-form";
import { Suspense } from "react";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
    const { callbackUrl } = await searchParams;
    const signupUrl = callbackUrl ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/signup";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1a1a1a_0%,transparent_70%)] opacity-50" />

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10">
                <div className="text-center mb-10">
                    {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-6">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div> */}
                    <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Acesso
                    </h1>
                    {/* <p className="text-zinc-400">Entre na sua conta para continuar</p> */}
                </div>

                <Suspense fallback={<div className="text-center text-zinc-500">Carregando...</div>}>
                    <LoginForm />
                </Suspense>

                <p className="mt-10 text-center text-zinc-500 text-sm">
                    Não tem uma conta?{" "}
                    <Link href={signupUrl} className="text-white font-semibold hover:underline decoration-blue-500 underline-offset-4">
                        Crie uma conta
                    </Link>
                </p>
            </div>
        </div>
    );
}
