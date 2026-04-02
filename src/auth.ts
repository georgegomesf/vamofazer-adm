import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";
import { jwtVerify } from "jose";

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                projectId: { label: "Project ID", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const projectId = credentials.projectId || process.env.NEXT_PUBLIC_PROJECT_ID;
                    const res = await axios.post(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/mobile/login`, {
                        email: credentials.email,
                        password: credentials.password,
                        projectId: projectId
                    });

                    if (res.data && res.data.user) {
                        return {
                            id: res.data.user.id,
                            email: res.data.user.email,
                            name: res.data.user.name,
                            role: res.data.user.role,
                            // @ts-ignore
                            projectRole: res.data.user.projectRole,
                            // @ts-ignore
                            image: res.data.user.image,
                            // @ts-ignore
                            token: res.data.token
                        };
                    }
                } catch (error) {
                    // @ts-ignore
                    console.error("Auth error:", error.response?.data || error.message);
                    return null;
                }
                return null;
            },
        }),
        Credentials({
            id: "token-transfer",
            name: "Token Transfer",
            credentials: {
                st: { label: "ST Token", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.st) return null;

                try {
                    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
                    const { payload } = await jwtVerify(credentials.st as string, secret);

                    if (payload) {
                        return {
                            id: payload.id as string,
                            email: payload.email as string,
                            name: payload.name as string,
                            image: payload.image as string,
                            role: payload.role as string,
                            // @ts-ignore
                            projectRole: payload.projectRole as string,
                            // @ts-ignore
                            token: payload.token as string, // Extract the persistent token here!
                        };
                    }
                } catch (error) {
                    console.error("Token transfer error:", error);
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token?.sub;
                // @ts-ignore
                session.user.role = token?.role;
                // @ts-ignore
                session.user.projectRole = token?.projectRole;
                // @ts-ignore
                session.user.image = token?.picture || token?.image;
                // @ts-ignore
                session.authToken = token?.token;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.projectRole = user.projectRole;
                // @ts-ignore
                token.image = user.image;
                // @ts-ignore
                token.token = user.token;
                // @ts-ignore
                token.picture = user.image;
            }

            if (trigger === "update" && session?.user) {
                if (session.user.name) token.name = session.user.name;
                // @ts-ignore
                if (session.user.image) token.image = session.user.image;
                // @ts-ignore
                if (session.user.image) token.picture = session.user.image;
                // @ts-ignore
                if (session.user.projectRole) token.projectRole = session.user.projectRole;
            }

            return token;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    cookies: {
        sessionToken: {
            name: "redefilosofica.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                // Removida a trava de domain fixo para suportar múltiplos domínios (basefilosofica.com.br, etc)
                // O navegador gravará o cookie para o host atual automaticamente.
            },
        },
        callbackUrl: {
            name: "redefilosofica.callback-url",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
        csrfToken: {
            name: "redefilosofica.csrf-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
});
