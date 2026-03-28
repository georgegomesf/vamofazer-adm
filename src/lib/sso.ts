/**
 * useSsoSync
 *
 * Após um login bem-sucedido, sincroniza a sessão com a outra aplicação
 * usando o mecanismo de "token-transfer" cross-domain.
 *
 * Fluxo:
 *  1. Chama GET /api/auth/sso-token para obter um JWT de 60s
 *  2. Redireciona para <peerUrl>/auth/callback?st=<token>&dest=<dest>
 *     na outra aplicação, que fará o login automaticamente lá.
 *
 * @param peerUrl  URL base da outra aplicação (ex: process.env.NEXT_PUBLIC_WEB_SERVICE_URL)
 * @param dest     Caminho destino na outra aplicação após login (padrão: "/")
 */
export async function syncSessionToPeer(peerUrl: string, dest = "/"): Promise<void> {
    try {
        const res = await fetch("/api/auth/sso-token");
        if (!res.ok) return;

        const { st } = await res.json();
        if (!st) return;

        // Usa um img pixel invisível para acionar o callback sem sair da página atual.
        // O redirect:false no signIn do peer garante que a sessão é criada silenciosamente.
        const callbackUrl = `${peerUrl}/auth/callback?st=${encodeURIComponent(st)}&dest=${encodeURIComponent(dest)}&silent=1`;

        // Abre em iframe oculto para não redirecionar o usuário
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.src = callbackUrl;
        document.body.appendChild(iframe);

        // Remove o iframe após 5 segundos
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 5000);
    } catch (err) {
        console.warn("[SSO] Falha ao sincronizar sessão com peer:", err);
    }
}

/**
 * signOutToPeer
 *
 * Encadeia o logout na outra aplicação antes de completar o processo de
 * logout local + auth-service.
 *
 * @param peerUrl         URL base da outra aplicação
 * @param finalCallbackUrl URL final após logout completo
 */
export function buildSignOutChain(peerUrl: string, finalCallbackUrl: string): string {
    // A outra app faz logout e depois redireciona para o finalCallbackUrl
    return `${peerUrl}/auth/signout?callbackUrl=${encodeURIComponent(finalCallbackUrl)}`;
}
