"use client";

import { useState } from "react";
import { Mail, ShieldQuestion, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { resetPassword } from "@/actions/reset";
import { useSearchParams } from "next/navigation";

export default function ResetForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "";

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const formData = new FormData();
        formData.append("email", email);
        formData.append("callbackUrl", callbackUrl);

        const result = await resetPassword(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(`Link de recuperação enviado com sucesso para ${email}!`);
            setEmail("");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 mb-6 font-bold">
                    <ShieldQuestion className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-zinc-950 to-zinc-600 bg-clip-text text-transparent">
                    Recuperar Senha
                </h1>
                <p className="text-zinc-500 text-sm">Digite seu e-mail para receber um link de redefinição</p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 p-4 rounded-xl text-sm leading-relaxed text-center">
                        {success}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-600 ml-1">E-mail</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-zinc-400"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enviar link de recuperação"}
                </button>
            </form>

            <div className="text-center">
                <Link href="/auth/signin" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-950 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o login
                </Link>
            </div>
        </div>
    );
}
