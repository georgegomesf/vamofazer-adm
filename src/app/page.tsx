import { auth, signOut } from "@/auth";
import { User, LogOut, Shield, ExternalLink, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/adm");
  } else {
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

    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-950 p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#e4e4e7_0%,transparent_70%)] opacity-50" />

        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-3xl p-8 shadow-xl relative z-10">
          <div className="text-center mb-10 text-zinc-950">
            <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-zinc-950 to-zinc-600 bg-clip-text text-transparent">
              {projectName}
            </h1>
          </div>

          <Suspense fallback={<div className="text-center text-zinc-500">Carregando...</div>}>
            <LoginForm />
          </Suspense>

          <p className="mt-10 text-center text-zinc-500 text-sm">
            Não tem uma conta?{" "}
            <Link href="/auth/signup" className="text-zinc-950 font-semibold hover:underline decoration-blue-500 underline-offset-4">
              Crie uma conta
            </Link>
          </p>
        </div>
      </main>
    );
  }
}
