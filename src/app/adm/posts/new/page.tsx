"use client";

import PostEditor from "@/components/admin/content/PostEditor";
import { useProject } from "@/context/ProjectContext";
import { Loader2 } from "lucide-react";

export default function NewPostPage() {
  const { project } = useProject();

  if (!project) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return <PostEditor projectId={project.id} />;
}
