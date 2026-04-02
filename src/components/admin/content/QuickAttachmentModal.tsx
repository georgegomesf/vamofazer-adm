"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Paperclip, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { createAttachment } from "@/actions/attachments";
import { getAttachmentTypeFromUrl } from "@/lib/attachment-utils";
import { useProject } from "@/context/ProjectContext";

interface QuickAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (attachmentId: string) => void;
  allAttachments: any[];
  linkedAttachmentIds: string[];
}

export default function QuickAttachmentModal({ isOpen, onClose, onSuccess, allAttachments, linkedAttachmentIds }: QuickAttachmentModalProps) {
  const [activeTab, setActiveTab] = useState<"new" | "existing">("existing");
  const [loading, setLoading] = useState(false);
  const [detectedType, setDetectedType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
  });

  const { projectId } = useProject();

  useEffect(() => {
    if (formData.url) {
      setDetectedType(getAttachmentTypeFromUrl(formData.url));
    } else {
      setDetectedType("");
    }
  }, [formData.url]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createAttachment(projectId, formData);

      if (result.success && result.attachment) {
        onSuccess(result.attachment.id);
        onClose();
        setFormData({ title: "", description: "", url: "" });
      } else {
        alert("Erro ao salvar anexo: " + (result.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Error saving attachment:", error);
      alert("Erro inesperado ao salvar anexo.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAttachments = allAttachments
    .filter(res => !linkedAttachmentIds.includes(res.id))
    .filter(res => res.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const displayedAttachments = searchTerm ? filteredAttachments : filteredAttachments.slice(0, 5);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-brand-500" />
          Gerenciar Anexos
        </h2>
      </div>

      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("existing")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "existing" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
        >
          Vincular Existente
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("new")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "new" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
        >
          Criar Novo
        </button>
      </div>

      {activeTab === "existing" ? (
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar anexos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {displayedAttachments.map((res) => (
              <button
                key={res.id}
                onClick={() => {
                  onSuccess(res.id);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-brand-500 hover:bg-brand-50 dark:border-gray-800 dark:hover:bg-brand-500/10 transition-all flex flex-col gap-0.5"
              >
                <span className="font-bold text-sm text-gray-900 dark:text-white">{res.title}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tight">{res.type}</span>
              </button>
            ))}
            {displayedAttachments.length === 0 && (
              <div className="py-8 text-center text-gray-500 italic text-sm">
                {searchTerm ? "Nenhum anexo encontrado para esta busca." : "Nenhum anexo disponível para vincular."}
              </div>
            )}
            {!searchTerm && filteredAttachments.length > 5 && (
              <p className="text-[10px] text-center text-gray-400 pt-2 uppercase tracking-widest font-bold opacity-60">
                Digite para buscar entre outros {filteredAttachments.length - 5} anexos
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Descreva o conteúdo..."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Link (URL)</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://..."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          {detectedType && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo Detectado</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{detectedType}</div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Criar e Vincular
            </Button>
          </div>
        </form>
      )}

      {activeTab === "existing" && (
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </Modal>
  );
}
