"use client";

import React, { useState } from "react";
import { Save, Loader2, ChevronLeft, FileText, User, Link as LinkIcon, School, GraduationCap, MapPin, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { upsertThesis } from "@/actions/library";

interface ThesisEditorProps {
  thesis?: any;
}

export default function ThesisEditor({ thesis }: ThesisEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: thesis?.id || "",
    title: thesis?.title || "",
    abstract: thesis?.abstract || "",
    authors: thesis?.authors || "",
    url: thesis?.url || "",
    keywords: thesis?.keywords || "",
    advisor: thesis?.advisor || "",
    university: thesis?.university || "",
    universityCity: thesis?.universityCity || "",
    universityInitials: thesis?.universityInitials || "",
    program: thesis?.program || "",
    programCode: thesis?.programCode || "",
    degree: thesis?.degree || "",
    line: thesis?.line || "",
    year: thesis?.year || "",
    datePublished: thesis?.datePublished ? new Date(thesis.datePublished).toISOString().split('T')[0] : "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? (value ? parseInt(value) : "") : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        year: formData.year ? parseInt(formData.year.toString()) : null,
        datePublished: formData.datePublished ? new Date(formData.datePublished).toISOString() : null,
      };

      if (!thesis && !submissionData.id) delete submissionData.id;

      await upsertThesis(submissionData);
      router.push("/adm/theses");
      router.refresh();
    } catch (error) {
      console.error("Error saving thesis:", error);
      alert("Erro ao salvar tese/dissertação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-left">
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
              {thesis ? "Editar Tese/Dissertação" : "Nova Tese/Dissertação"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {thesis ? "Atualize as informações do trabalho acadêmico." : "Adicione um novo trabalho à biblioteca."}
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">Título</label>
                <textarea
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 text-xl font-bold rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                  placeholder="Título do Trabalho"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">Resumo / Abstract</label>
                <textarea
                  name="abstract"
                  value={formData.abstract}
                  onChange={handleInputChange}
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm leading-relaxed"
                  placeholder="Resumo do trabalho acadêmico..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">Palavras-chave</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                        type="text"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                        placeholder="Palavra 1; Palavra 2; ..."
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">Página/Link</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                        type="url"
                        name="url"
                        value={formData.url}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                        placeholder="https://..."
                        />
                    </div>
                  </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 leading-relaxed">
             <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
               <School className="h-5 w-5 text-brand-500" /> Instituição e Programa
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Instituição de Ensino Superior (IES)</label>
                    <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                    placeholder="Nome completo da Universidade"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Sigla IES</label>
                        <input
                        type="text"
                        name="universityInitials"
                        value={formData.universityInitials}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                        placeholder="Ex: USP"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Estado (UF)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                            type="text"
                            name="universityCity"
                            value={formData.universityCity}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                            placeholder="Ex: SP"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Programa de Pós-Graduação</label>
                    <input
                    type="text"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                    placeholder="Nome do Programa"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Código do Programa (CAPES)</label>
                    <input
                    type="text"
                    name="programCode"
                    value={formData.programCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm font-mono"
                    placeholder="00000000000P0"
                    />
                </div>
             </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-brand-500" /> Autoria e Defesa
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Autor(a)</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                    type="text"
                    name="authors"
                    value={formData.authors}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Nome completo do autor"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Orientador(a)</label>
                <input
                  type="text"
                  name="advisor"
                  value={formData.advisor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Nome do orientador"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Grau Acadêmico</label>
                <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    >
                    <option value="">Selecione...</option>
                    <option value="MESTRADO">Mestrado</option>
                    <option value="DOUTORADO">Doutorado</option>
                    <option value="MESTRADO PROFISSIONAL">Mestrado Profissional</option>
                    </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Ano</label>
                    <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        placeholder="Ex: 2023"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Defesa</label>
                    <input
                        type="date"
                        name="datePublished"
                        value={formData.datePublished}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
             <h3 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2 mb-4">Linha de Pesquisa</h3>
             <textarea
                  name="line"
                  value={formData.line}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                  placeholder="Descrição da linha de pesquisa..."
                />
          </section>
        </div>
      </form>
    </div>
  );
}
