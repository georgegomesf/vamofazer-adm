"use client";

import { useEffect, Suspense } from "react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function SignOutContent() {
    const searchParams = useSearchParams();
    const finalCallbackUrl = searchParams.get("callbackUrl") || "/";

    useEffect(() => {
        const performSignOut = async () => {
            console.log("AUTH SIGNOUT: Starting process...");
            const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;

            // 1. Limpa a sessão local no web-auth
            await signOut({
                redirect: false
            });

            // 2. Redireciona para o logout central para limpar a sessão no @auth também
            if (authServiceUrl) {
                const globalSignOutUrl = `${authServiceUrl}/auth/signout?callbackUrl=${encodeURIComponent(window.location.origin + finalCallbackUrl)}`;
                window.location.href = globalSignOutUrl;
            } else {
                window.location.href = finalCallbackUrl;
            }
        };

        performSignOut();
    }, [finalCallbackUrl]);

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-zinc-500 animate-pulse font-medium text-lg uppercase tracking-widest leading-relaxed">
                Saindo da conta...
            </p>
        </div>
    );
}

export default function SignOutPage() {
    return (
        <Suspense fallback={null}>
            <SignOutContent />
        </Suspense>
    );
}
