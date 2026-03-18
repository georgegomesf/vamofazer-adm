"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [error, setError] = useState("");

    useEffect(() => {
        const st = searchParams.get("st");
        const dest = searchParams.get("dest") || "/";

        if (st) {
            signIn("token-transfer", {
                st,
                callbackUrl: dest,
                redirect: true
            });
        } else {
            router.push("/");
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p className="text-zinc-500">Finalizando autenticação...</p>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col items-center justify-center p-6 text-center"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" /><p className="text-zinc-500">Carregando...</p></div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}
