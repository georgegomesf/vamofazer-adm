import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SignJWT } from "jose";

/**
 * GET /api/auth/sso-token
 *
 * Gera um JWT de curta duração (60s) com os dados da sessão atual
 * para ser consumido pela outra aplicação via o provider "token-transfer".
 * Requer que o usuário já esteja autenticado nesta app.
 */
export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

    const st = await new SignJWT({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: (session.user as any).image,
        role: (session.user as any).role,
        projectRole: (session.user as any).projectRole,
        token: (session as any).authToken,
        status: (session.user as any).status,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("60s") // expira em 60 segundos
        .sign(secret);

    return NextResponse.json({ st });
}
