"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, ChevronLeft, Layers, Link as LinkIcon, FileText, Image as ImageIcon, Calendar, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { upsertIssue, getJournals } from "@/actions/library";
import { uploadImage, deleteImage } from "@/actions/upload";

interface IssueEditorProps {
  issue?: any;
}

export default function IssueEditor({ issue }: IssueEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: issue?.id || "",
    journalId: issue?.journalId || "",
    title: issue?.title || "",
    volume: issue?.volume || "",
    number: issue?.number || "",
    year: issue?.year || "",
    description: issue?.description || "",
    link: issue?.link || "",
    coverUrl: issue?.coverUrl || "",
    datePublished: issue?.datePublished ? new Date(issue.datePublished).toISOString().split('T')[0] : "",
  });

  useEffect(() => {
    async function fetchJournals() {
      const data = await getJournals();
      setJournals(data);
    }
    fetchJournals();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      if (formData.coverUrl && formData.coverUrl.includes("blob.vercel-storage.com")) {
        await deleteImage(formData.coverUrl);
      }

      const uploadFactBox = new FormData();
      uploadFactBox.append("file", file);
      const blob = await uploadImage(uploadFactBox);
      setFormData(prev => ({ ...prev, coverUrl: blob.url }));
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Falha no upload da imagem.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        year: formData.year ? parseInt(formData.year as string) : null,
        datePublished: formData.datePublished ? new Date(formData.datePublished).toISOString() : null,
      };
      
      if (!issue && !submissionData.id) delete (submissionData as any).id;

      await upsertIssue(submissionData);
      router.push("/adm/issues");
      router.refresh();
    } catch (error) {
      console.error("Error saving issue:", error);
      alert("Erro ao salvar edição.");
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
              {issue ? "Editar Edição" : "Nova Edição"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {issue ? "Atualize as informações da edição." : "Adicione uma nova edição à revista."}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-4">
              {!issue && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Identificador (Opcional)</label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                    placeholder="ID da edição (ex: 200000034)"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Revista</label>
                <select
                  name="journalId"
                  value={formData.journalId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">Selecione uma revista...</option>
                  {journals.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título / Nome</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Título da Edição"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Volume</label>
                  <input
                    type="text"
                    name="volume"
                    value={formData.volume}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="ex: 11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Número</label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="ex: 2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ano</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="ex: 2024"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                    placeholder="Resumo da edição..."
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-brand-500" /> Capa
            </h3>
            <div className="space-y-4">
              <div className="relative group aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                {formData.coverUrl ? (
                  <div className="relative w-full h-full group flex items-center justify-center">
                    <img src={formData.coverUrl} className="w-full h-full object-cover" alt="Cover Preview" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverUrl: "" }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer text-center p-4 w-full h-full flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors">
                    <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <span className="text-xs text-gray-400">Clique para enviar imagem</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Ou cole uma URL</label>
                <input
                  type="text"
                  name="coverUrl"
                  value={formData.coverUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="URL da Imagem de Capa"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-500" /> Publicação
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Data</label>
                <input
                  type="date"
                  name="datePublished"
                  value={formData.datePublished}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Link</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
