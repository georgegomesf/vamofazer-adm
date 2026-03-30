"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getThesis } from "@/actions/library";
import ThesisEditor from "@/components/admin/library/ThesisEditor";
import { Loader2 } from "lucide-react";

export default function EditThesisPage() {
  const params = useParams();
  const id = params.id as string;
  const [thesis, setThesis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThesis() {
      const data = await getThesis(id);
      setThesis(data);
      setLoading(false);
    }
    fetchThesis();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="py-20 text-center text-left max-w-xl mx-auto">
        <h2 className="text-xl font-bold">Item não encontrado na biblioteca.</h2>
        <p className="text-gray-500 mt-2">O identificador "{id}" não corresponde a nenhuma tese ou dissertação cadastrada.</p>
      </div>
    );
  }

  return <ThesisEditor thesis={thesis} />;
}
