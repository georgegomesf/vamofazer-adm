"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, ChevronLeft, Calendar, ImageIcon, Trash2, Type, Building2, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { createAction, updateAction } from "@/actions/actions";
import { uploadImage } from "@/actions/upload";

interface ActionEditorProps {
  action?: any; // If provided, it's edit mode
}

export default function ActionEditor({ action }: ActionEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Atividade",
    imageUrl: "",
    organizer: "",
    url: "",
    startDate: "",
    endDate: "",
  });

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  const formatToLocalDatetime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  };

  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title || "",
        description: action.description || "",
        type: action.type || "Atividade",
        imageUrl: action.imageUrl || "",
        organizer: action.organizer || "",
        url: action.url || "",
        startDate: formatToLocalDatetime(action.startDate),
        endDate: formatToLocalDatetime(action.endDate),
      });
    }
  }, [action]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await uploadImage(form);
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      let result;
      const submissionData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate + (formData.startDate.includes("Z") ? "" : "Z")).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate + (formData.endDate.includes("Z") ? "" : "Z")).toISOString() : null,
      };

      if (action) {
        result = await updateAction(action.id, submissionData);
      } else {
        result = await createAction(projectId, submissionData);
      }

      if (result.success) {
        router.push("/adm/actions");
      } else {
        alert("Erro ao salvar ação: " + (result.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Error saving action:", error);
      alert("Erro inesperado ao salvar ação.");
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
              {action ? "Editar Ação" : "Nova Ação"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gerencie eventos, prazos e atividades.
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading || isUploading} className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ex: Workshop de Ética"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Descreva os detalhes desta ação..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" /> Organizador
                  </label>
                  <input
                    type="text"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    placeholder="Ex: PPGFil-UFRRJ"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" /> Link / URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Início</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Fim</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-6 flex items-center gap-2">
              <Type className="h-4 w-4" /> Configurações
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Ação</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white ring-offset-white dark:ring-offset-gray-900 cursor-pointer"
                >
                  <option value="Evento">Evento</option>
                  <option value="Prazo">Prazo</option>
                  <option value="Atividade">Atividade</option>
                </select>
                <p className="text-[10px] text-gray-500 italic mt-1">
                  Evento e Prazo são limitados a um por postagem.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagem da Ação</label>
                <div className="aspect-video relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
                  ) : formData.imageUrl ? (
                    <div className="group relative w-full h-full">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-center p-4 w-full h-full flex flex-col items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <span className="text-xs text-gray-400">Clique para enviar imagem</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
                <div className="mt-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Ou URL da Imagem</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
