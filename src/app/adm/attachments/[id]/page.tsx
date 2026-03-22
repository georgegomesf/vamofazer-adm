"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAttachmentById } from "@/actions/attachments";
import AttachmentEditor from "@/components/admin/content/AttachmentEditor";
import { Loader2 } from "lucide-react";

export default function EditAttachmentPage() {
  const params = useParams();
  const id = params.id as string;
  const [attachment, setAttachment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await getAttachmentById(id);
      setAttachment(data);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!attachment) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Anexo não encontrado</h2>
        <p className="text-gray-500">O anexo que você está tentando editar não existe.</p>
      </div>
    );
  }

  return <AttachmentEditor attachment={attachment} />;
}
