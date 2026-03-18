"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Mail, Lock, User, ShieldCheck, MailQuestion, Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const emailSent = searchParams.get("email_sent") === "true";
    const verified = searchParams.get("verified") === "true";
    const registeredEmail = searchParams.get("email") || "";

    const [magicLinkSent, setMagicLinkSent] = useState(false);

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;

    const handleGoogleLogin = async () => {
        setLoading(true);
        // Redirect to the remote auth service for Google login
        const currentOrigin = window.location.origin;
        const targetCallback = `${currentOrigin}/auth/callback?dest=${encodeURIComponent(callbackUrl)}`;
        window.location.href = `${authServiceUrl}/auth/signin?callbackUrl=${encodeURIComponent(targetCallback)}&projectId=${projectId}&autoLogin=google`;
    };

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email: email || registeredEmail,
                password,
                projectId,
                redirect: false,
            });

            if (res?.error) {
                setError("E-mail ou senha inválidos");
                setLoading(false);
            } else {
                router.push(callbackUrl);
            }
        } catch (err) {
            setError("Algo deu errado. Tente novamente.");
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email && !registeredEmail) {
            setError("Digite seu e-mail para receber o link");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const currentOrigin = window.location.origin;
            const res = await fetch(`${authServiceUrl}/api/mobile/magic-link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email || registeredEmail,
                    callbackUrl: callbackUrl,
                    projectId: projectId
                })
            });

            const data = await res.json();

            if (data.success) {
                setMagicLinkSent(true);
            } else {
                setError(data.error || "Algo deu errado");
            }
        } catch (err) {
            setError("Não foi possível enviar o link. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {emailSent && (
                <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 p-4 rounded-xl text-sm leading-relaxed">
                    Conta criada! Enviamos um link de confirmação para <strong>{registeredEmail}</strong>. Verifique sua caixa de entrada para ativar sua conta.
                </div>
            )}
            {magicLinkSent && (
                <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 p-4 rounded-xl text-sm leading-relaxed text-center">
                    Link de acesso enviado! Verifique seu e-mail (<strong>{email || registeredEmail}</strong>) para entrar.
                </div>
            )}
            {verified && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-sm leading-relaxed text-center">
                    Email verificado com sucesso. Faça seu login.
                </div>
            )}

            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-zinc-200 transition-all duration-200 group disabled:opacity-50"
            >
                <GoogleIcon className="w-5 h-5" />
                <span>Continuar com Google</span>
            </button>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b0b0b] px-4 text-zinc-500 font-medium tracking-widest">ou use e-mail e senha</span>
                </div>
            </div>

            <form onSubmit={handleCredentialsLogin} className="space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300 ml-1">E-mail</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="email"
                            value={email || registeredEmail}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            className="w-full bg-zinc-900/80 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-medium text-zinc-300">Senha</label>
                        <Link href="/auth/reset" className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors">
                            Esqueceu a senha?
                        </Link>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full bg-zinc-900/80 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Entrar Agora"}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b0b0b] px-4 text-zinc-500 font-medium tracking-widest">OU receba um</span>
                </div>
            </div>

            <div className="flex gap-3 justify-center">
                <button
                    onClick={handleMagicLink}
                    disabled={loading}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors border border-zinc-800 rounded-lg px-4 py-2 hover:bg-zinc-800 disabled:opacity-50"
                >
                    <MailQuestion className="w-4 h-4" />
                    LINK de acesso por e-mail
                </button>
            </div>
        </div>
    );
}
