import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  let projectName = "Portaria Digital";

  if (projectId) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/projects/${projectId}`);
      const project = await res.json();
      if (project.name) {
        projectName = project.name;
      }
    } catch (e) {}
  }

  return {
    title: projectName,
    description: "Sistema de Autenticação Unificada",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
