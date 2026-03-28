"use client";

import { useEffect, Suspense, useRef } from "react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function SignOutContent() {
    const searchParams = useSearchParams();
    let finalCallbackUrl = searchParams.get("callbackUrl") || "/";

    const skipPeer = searchParams.get("skipPeer") === "1";

    const isStarted = useRef(false);
    useEffect(() => {
        const performSignOut = async () => {
            if (isStarted.current) return;
            isStarted.current = true;

            // Garantir que a URL de retorno final seja absoluta
            if (finalCallbackUrl.startsWith("/")) {
                finalCallbackUrl = window.location.origin + finalCallbackUrl;
            }

            const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
            const peerUrl = process.env.NEXT_PUBLIC_WEB_SERVICE_URL;

            try {
                // 1. Limpa a sessão local no adm
                await signOut({ redirect: false });
            } catch (err) {
                console.warn("Local signOut error:", err);
            }

            if (!skipPeer && peerUrl) {
                // 2. Criar a URL de logout central que possui o retorno final
                const authLogoutUrl = authServiceUrl
                    ? `${authServiceUrl}/auth/signout?callbackUrl=${encodeURIComponent(finalCallbackUrl)}`
                    : finalCallbackUrl;

                // 3. Delegar para o peer, passando a URL do auth central como callback
                window.location.href = `${peerUrl}/auth/signout?callbackUrl=${encodeURIComponent(authLogoutUrl)}&skipPeer=1`;
            } else {
                // Já fomos chamados pelo peer, ou não há peer.
                // A finalCallbackUrl já contém a URL do auth-service criada pelo iniciador.
                if (skipPeer) {
                    window.location.href = finalCallbackUrl;
                } else {
                    if (authServiceUrl) {
                        window.location.href = `${authServiceUrl}/auth/signout?callbackUrl=${encodeURIComponent(finalCallbackUrl)}`;
                    } else {
                        window.location.href = finalCallbackUrl;
                    }
                }
            }
        };

        performSignOut();
    }, [finalCallbackUrl, skipPeer]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center text-zinc-950 p-6 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
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

