"use client";

import { useSidebar, SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { ProjectProvider } from "@/context/ProjectContext";
import "flatpickr/dist/flatpickr.css";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Only show the loading state on initial mount if we don't have a session yet
  if (status === "loading" && !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!session) return null;

  const userRole = (session.user as any)?.role;
  const projectRole = (session.user as any)?.projectRole;
  const isAdmin = userRole === "ADMIN" || projectRole === "admin";
  const isEditor = projectRole === "editor";
  const hasAccess = isAdmin || isEditor;
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith("/adm/projeto") || pathname?.startsWith("/adm/usuarios");

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center dark:bg-gray-900">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-red-500">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Acesso Restrito</h1>
          <p className="text-gray-500 mb-8 dark:text-gray-400">
            Você ainda não tem acesso a este ambiente. <br />
            Contate o administrador do sistema.
          </p>
          <div className="flex flex-col gap-3">
            {/* <div className="p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              Role: <span className="text-red-600 dark:text-red-400 font-bold">{userRole || "Visitante"}</span>
              {projectRole && (
                <span className="ml-2 border-l border-gray-300 pl-2 dark:border-gray-600">
                  Projeto: <span className="text-red-600 dark:text-red-400 font-bold uppercase">{projectRole}</span>
                </span>
              )}
            </div> */}
            <button
              onClick={() => router.push("/auth/signout")}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl transition-all font-semibold"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminRoute && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center dark:bg-gray-900">
        <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-yellow-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Acesso Restrito</h1>
          <p className="text-gray-500 mb-8 dark:text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
          <button
            onClick={() => router.push("/adm")}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl transition-all font-semibold"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SidebarProvider>
          <ProjectProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
          </ProjectProvider>
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
