"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, ChevronLeft, FileText, User, Link as LinkIcon, Calendar, Type, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { upsertArticle, getIssues } from "@/actions/library";

interface ArticleEditorProps {
  article?: any;
}

export default function ArticleEditor({ article }: ArticleEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: article?.id || "",
    issueId: article?.issueId || "",
    title: article?.title || "",
    abstract: article?.abstract || "",
    authors: article?.authors || "",
    doi: article?.doi || "",
    url: article?.url || "",
    pages: article?.pages || "",
    language: article?.language || "",
    keywords: article?.keywords || "",
    bibliography: article?.bibliography || "",
    datePublished: article?.datePublished ? new Date(article.datePublished).toISOString().split('T')[0] : "",
  });

  useEffect(() => {
    async function fetchIssues() {
      const data = await getIssues({ pageSize: 1000 });
      setIssues(data.issues || []);
    }
    fetchIssues();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        datePublished: formData.datePublished ? new Date(formData.datePublished).toISOString() : null,
      };

      if (!article && !submissionData.id) delete submissionData.id;

      await upsertArticle(submissionData);
      router.push("/adm/articles");
      router.refresh();
    } catch (error) {
      console.error("Error saving article:", error);
      alert("Erro ao salvar artigo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
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
              {article ? "Editar Artigo" : "Novo Artigo"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {article ? "Atualize o conteúdo do artigo científico." : "Adicione um novo artigo à biblioteca."}
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
            <div className="space-y-6">
              {!article && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Identificador (Opcional)</label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm font-mono"
                    placeholder="ID do artigo (ex: 300002235)"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                <textarea
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="w-full px-4 py-2 text-xl font-bold rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                  placeholder="Título do Artigo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Resumo</label>
                <textarea
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm leading-relaxed"
                  placeholder="Resumo do artigo..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Palavras-chave</label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                  placeholder="Termo 1; Termo 2; ..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bibliografia / Referências</label>
                <textarea
                  name="bibliography"
                  value={formData.bibliography}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs font-mono"
                  placeholder="Lista de referências bibliográficas..."
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-500" /> Relacionamento
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Edição</label>
                <select
                  name="issueId"
                  value={formData.issueId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">Selecione uma edição...</option>
                  {issues.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.journal.title} - {i.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-brand-500" /> Metadados
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Autores</label>
                <textarea
                  name="authors"
                  value={formData.authors}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                  placeholder="Nome dos autores..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">DOI</label>
                <input
                  type="text"
                  name="doi"
                  value={formData.doi}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="digital-object-identifier"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Idioma</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  <option value="pt">Português</option>
                  <option value="en">Inglês</option>
                  <option value="es">Espanhol</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Link / URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Páginas</label>
                <input
                  type="text"
                  name="pages"
                  value={formData.pages}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="ex: 33-48"
                />
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
