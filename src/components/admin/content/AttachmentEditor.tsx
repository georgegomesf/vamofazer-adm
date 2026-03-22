"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, Paperclip, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { createAttachment, updateAttachment } from "@/actions/attachments";
import { getAttachmentTypeFromUrl } from "@/lib/attachment-utils";

interface AttachmentEditorProps {
  attachment?: any; // If provided, it's edit mode
}

export default function AttachmentEditor({ attachment }: AttachmentEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [detectedType, setDetectedType] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    url: "",
  });

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  useEffect(() => {
    if (attachment) {
      setFormData({
        title: attachment.title || "",
        url: attachment.url || "",
      });
      setDetectedType(attachment.type || "");
    }
  }, [attachment]);

  useEffect(() => {
    if (formData.url) {
      setDetectedType(getAttachmentTypeFromUrl(formData.url));
    } else {
      setDetectedType("");
    }
  }, [formData.url]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    console.log("Submitting attachment form:", { projectId, formData });
    try {
      let result;
      console.log("Calling createAttachment/updateAttachment action...");
      if (attachment) {
        result = await updateAttachment(attachment.id, formData);
      } else {
        result = await createAttachment(projectId, formData);
      }
      console.log("Action result:", result);

      if (result.success) {
        router.push("/adm/attachments");
      } else {
        alert("Erro ao salvar anexo: " + result.error);
      }
    } catch (error) {
      console.error("Error saving attachment:", error);
      alert("Erro inesperado ao salvar anexo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {attachment ? "Editar Anexo" : "Novo Anexo"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Vincule conteúdos externos ao seu projeto.
            </p>
          </div>
        </div>
        <Button type="submit" form="attachment-form" disabled={loading} className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <form id="attachment-form" onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Aula sobre Platão"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fonte (URL)</label>
              <div className="relative">
                <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            {detectedType && (
              <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
                <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
                  Tipo Detectado
                </div>
                <div className="text-brand-900 dark:text-brand-300 font-medium">
                  {detectedType}
                </div>
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
