"use client";

import { useState } from "react";
import { Lock, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePassword } from "@/actions/new-password";
import Link from "next/link";

export default function NewPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const formData = new FormData();
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);

        const result = await updatePassword(formData, token);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(result.success || "");
            setLoading(false);
            // Redirecionar para login após 3 segundos
            setTimeout(() => {
                router.push("/auth/signin?verified=true");
            }, 3000);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-6 py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">Pronto!</h2>
                <p className="text-zinc-400">Sua senha foi atualizada com sucesso. Você será redirecionado para a tela de login em instantes.</p>
                <Link href="/auth/signin" className="inline-block text-blue-500 hover:underline font-medium">Ir para o login agora</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 mb-6">
                    <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Nova Senha
                </h1>
                <p className="text-zinc-400 text-sm">Crie uma nova senha segura para sua conta</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 ml-1">Nova Senha</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                            className="w-full bg-zinc-900/80 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 ml-1">Confirmar Nova Senha</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita sua nova senha"
                            required
                            className="w-full bg-zinc-900/80 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center pt-4 mt-2"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Atualizar Senha"}
                </button>
            </form>
        </div>
    );
}
