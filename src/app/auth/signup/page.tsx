import Link from "next/link";
import { ShieldPlus } from "lucide-react";
import RegisterForm from "@/components/auth/register-form";
import { Suspense } from "react";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
    const { callbackUrl } = await searchParams;
    const signinUrl = callbackUrl ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/signin";

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-950 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,#e4e4e7_0%,transparent_70%)] opacity-50" />

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-3xl p-8 shadow-xl relative z-10">
                <div className="text-center mb-10">
                    {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 mb-6">
                        <ShieldPlus className="w-8 h-8 text-white" />
                    </div> */}
                    <h1 className="text-3xl font-bold tracking-tight mb-0 bg-gradient-to-r from-zinc-950 to-zinc-600 bg-clip-text text-transparent">
                        Crie sua conta
                    </h1>
                    {/* <p className="text-zinc-500">Junte-se a nós para começar sua jornada</p> */}
                </div>

                <Suspense fallback={<div className="text-center text-zinc-500">Carregando...</div>}>
                    <RegisterForm />
                </Suspense>

                <p className="mt-4 text-center text-zinc-500 text-sm">
                    Já tem uma conta?{" "}
                    <Link href={signinUrl} className="text-zinc-950 font-semibold hover:underline decoration-emerald-500 underline-offset-4">
                        Fazer login
                    </Link>
                </p>
            </div>
        </div>
    );
}
