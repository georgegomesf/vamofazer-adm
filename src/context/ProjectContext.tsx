"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface ProjectData {
  id: string;
  name: string;
  logoUrl: string | null;
  logoHorizontalUrl: string | null;
}

interface ProjectContextType {
  project: ProjectData | null;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
        const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
        
        if (projectId && authServiceUrl) {
          const res = await axios.get(`${authServiceUrl}/api/projects/${projectId}`);
          setProject(res.data);
        }
      } catch (error) {
        console.error("Error fetching project for context:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, []);

  return (
    <ProjectContext.Provider value={{ project, loading }}>
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
