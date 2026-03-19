export const dynamic = "force-dynamic";
import { auth, signOut } from "@/auth";
import { User, LogOut, Shield, ExternalLink, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  let projectName = "Autenticador";

  if (projectId) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/projects/${projectId}`);
      const project = await res.json();
      if (project.name) projectName = project.name;
    } catch (e) {
      console.error("Error fetching project:", e);
    }
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-white text-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-12 animate-pulse">
          <Image
            src="/logo.png"
            alt={`${projectName} Logo`}
            width={200}
            height={200}
            className="w-48 h-auto"
            priority
          />
        </div>
        <div className="flex gap-4">
          <a href="/auth/signin" className="bg-zinc-950 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all">
            Entrar
          </a>
          <a href="/auth/signup" className="border border-zinc-200 px-8 py-3 rounded-xl font-bold hover:bg-zinc-100 transition-all">
            Criar Conta
          </a>
        </div>
      </main>
    );
  }

  const isAdmin = (session.user as any)?.role === "ADMIN";

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">{projectName}</span>
          </div>

          <Link
            href="/auth/signout"
            className="flex items-center gap-2 bg-white hover:bg-zinc-100 border border-zinc-200 px-4 py-2 rounded-lg transition-all text-zinc-500 hover:text-zinc-950"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Link>
        </header>

        <div className={isAdmin ? "grid md:grid-cols-3 gap-8" : "max-w-md mx-auto"}>
          {/* User Profile Card */}
          <div className={`${isAdmin ? "md:col-span-1" : "w-full"} border border-zinc-200 bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-sm`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 mb-6">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="User" width={96} height={96} />
                  ) : (
                    <User className="w-12 h-12 text-zinc-600" />
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-1">{session.user?.name || session.user?.email?.split('@')[0]}</h2>
              <p className="text-zinc-500 mb-6">{session.user?.email}</p>

              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold uppercase tracking-wider">
                {/* @ts-ignore */}
                {session.user?.role || "USER"}
              </div>
            </div>
          </div>

          {/* Features / Services Card - Only for ADMIN */}
          {isAdmin && (
            <div className="md:col-span-2 space-y-6">
              <h3 className="text-xl font-bold mb-4">Sistemas Integrados</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 bg-white border border-zinc-200 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-500/5 rounded-xl flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs font-bold text-zinc-600 group-hover:text-blue-500">CONECTADO</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">Plataforma Web</h4>
                  <p className="text-sm text-zinc-500">Acesse seus dados em qualquer navegador com segurança.</p>
                </div>

                <div className="p-6 bg-white border border-zinc-200 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer group shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className="text-xs font-bold text-zinc-500 group-hover:text-indigo-500">DISPONÍVEL</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">Aplicativo Mobile</h4>
                  <p className="text-sm text-zinc-500">Autenticação rápida via Deep Links e tokens seguros.</p>
                </div>
              </div>

              <div className="p-8 bg-white border border-zinc-200 rounded-3xl mt-8 shadow-sm">
                <h4 className="font-bold text-lg mb-4">Dados da Sessão</h4>
                <pre className="bg-zinc-50 p-6 rounded-2xl text-xs font-mono text-zinc-600 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
