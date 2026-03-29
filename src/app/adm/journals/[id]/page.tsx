"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getJournal } from "@/actions/library";
import JournalEditor from "@/components/admin/library/JournalEditor";
import { Loader2 } from "lucide-react";

export default function EditJournalPage() {
  const params = useParams();
  const id = params.id as string;
  const [journal, setJournal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJournal() {
      const data = await getJournal(id);
      setJournal(data);
      setLoading(false);
    }
    fetchJournal();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold">Revista não encontrada.</h2>
      </div>
    );
  }

  return <JournalEditor journal={journal} />;
}
