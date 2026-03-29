"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getIssue } from "@/actions/library";
import IssueEditor from "@/components/admin/library/IssueEditor";
import { Loader2 } from "lucide-react";

export default function EditIssuePage() {
  const params = useParams();
  const id = params.id as string;
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIssue() {
      const data = await getIssue(id);
      setIssue(data);
      setLoading(false);
    }
    fetchIssue();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold">Edição não encontrada.</h2>
      </div>
    );
  }

  return <IssueEditor issue={issue} />;
}
