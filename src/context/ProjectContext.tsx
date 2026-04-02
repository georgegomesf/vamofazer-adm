"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "redefilosofica_selected_project_id";
const LINK_STORAGE_KEY = "redefilosofica_project_link";

export interface ProjectData {
  id: string;
  name: string;
  logoUrl: string | null;
  logoHorizontalUrl: string | null;
  link: string | null;
  role: string | null;
}

interface ProjectContextType {
  project: ProjectData | null;
  projectId: string | null;
  projectRole: string | null;
  projects: ProjectData[];
  loading: boolean;
  switchProject: (projectId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status, update } = useSession();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchUserProjects = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/user-projects");
        const userProjects: ProjectData[] = res.data?.projects || [];
        setProjects(userProjects);

        // Restore previously selected project or fall back to env default / first available
        const stored = localStorage.getItem(STORAGE_KEY);
        const envDefault = process.env.NEXT_PUBLIC_PROJECT_ID;

        const preferred =
          (stored && userProjects.find((p) => p.id === stored)?.id) ||
          (envDefault && userProjects.find((p) => p.id === envDefault)?.id) ||
          userProjects[0]?.id ||
          null;

        setProjectId(preferred);
      } catch (error) {
        console.error("Error fetching user projects:", error);
        setProjectId(process.env.NEXT_PUBLIC_PROJECT_ID ?? null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [status]);

  // Derive project object from the list — no extra fetch needed
  const project = projects.find((p) => p.id === projectId) ?? null;
  const projectRole = project?.role ?? null;

  // Sync session projectRole when project changes
  useEffect(() => {
    if (status === "authenticated" && projectRole && (session?.user as any)?.projectRole !== projectRole) {
      update({
        user: {
          projectRole: projectRole
        }
      });
    }
  }, [projectRole, status, update, session]);

  // Persist project link so pages outside this provider (e.g. /auth/signout) can read it
  useEffect(() => {
    if (project?.link) {
      localStorage.setItem(LINK_STORAGE_KEY, project.link);
    }
  }, [project?.link]);

  const switchProject = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setProjectId(id);
  }, []);

  return (
    <ProjectContext.Provider value={{ project, projectId, projectRole, projects, loading, switchProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
