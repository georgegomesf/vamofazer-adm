"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, ChevronLeft, Calendar, ImageIcon, Trash2, Type, Building2, Globe, Users, Search, Puzzle, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { createAction, updateAction } from "@/actions/actions";
import { uploadImage } from "@/actions/upload";
import { useProject } from "@/context/ProjectContext";
import { getGroups, createGroup, updateGroup } from "@/actions/groups";
import { getPlugins } from "@/actions/plugins";
import { formatToLocalDatetime, parseLocalToWallClockUTC } from "@/lib/date-utils";
import Badge from "@/components/ui/badge/Badge";

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
    backgroundUrl: "",
    organizer: "",
    url: "",
    startDate: "",
    endDate: "",
    publishedAt: formatToLocalDatetime(new Date()),
    onlyMembers: false,
    isPublished: true,
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: "", description: "" });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [availablePlugins, setAvailablePlugins] = useState<any[]>([]);
  const [selectedPluginIds, setSelectedPluginIds] = useState<string[]>([]);
  const [pluginSearch, setPluginSearch] = useState("");

  const { projectId } = useProject();


  useEffect(() => {
    if (projectId) {
      getGroups(projectId).then(groups => setAvailableGroups(groups || []));
      getPlugins().then(plugins => setAvailablePlugins(plugins || []));
    }
  }, [projectId]);

  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title || "",
        description: action.description || "",
        type: action.type || "Atividade",
        imageUrl: action.imageUrl || "",
        backgroundUrl: action.backgroundUrl || "",
        organizer: action.organizer || "",
        url: action.url || "",
        startDate: formatToLocalDatetime(action.startDate),
        endDate: formatToLocalDatetime(action.endDate),
        publishedAt: formatToLocalDatetime(action.publishedAt || action.createdAt),
        onlyMembers: action.onlyMembers || false,
        isPublished: action.publishedAt !== null,
      });
      if (action.ActionGroup && action.ActionGroup.length > 0) {
        setSelectedGroupId(action.ActionGroup[0].groupId);
      } else {
        setSelectedGroupId(null);
      }
      if (action.ActionPlugin && action.ActionPlugin.length > 0) {
        setSelectedPluginIds(action.ActionPlugin.map((ap: any) => ap.pluginId));
      } else {
        setSelectedPluginIds([]);
      }
    }
  }, [action]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await uploadImage(form);
      setFormData(prev => ({ ...prev, backgroundUrl: result.url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao enviar imagem de fundo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(prev => prev === groupId ? null : groupId);
  };

  const handleQuickCreate = async () => {
    if (!projectId || !newGroupData.name.trim()) return;
    setCreatingGroup(true);
    try {
      const res = await createGroup(projectId, {
        ...newGroupData
      });
      if (res.success && res.group) {
        const addedGroup = res.group;
        setAvailableGroups(prev => [addedGroup, ...prev]);
        setSelectedGroupId(addedGroup.id);
        setShowQuickCreate(false);
        setNewGroupData({ name: "", description: "" });
      } else {
        alert("Erro ao criar grupo: " + (res.error || "Objeto de grupo não retornado"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const toggleQuickCreate = () => {
    if (!showQuickCreate) {
      setNewGroupData({
        name: formData.title || "",
        description: formData.title ? `Grupo de participantes de ${formData.title}` : ""
      });
    }
    setShowQuickCreate(!showQuickCreate);
  };

  const handlePluginToggle = (pluginId: string) => {
    setSelectedPluginIds(prev =>
      prev.includes(pluginId)
        ? prev.filter(id => id !== pluginId)
        : [...prev, pluginId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      let result;
      const submissionData: any = {
        ...formData,
        startDate: parseLocalToWallClockUTC(formData.startDate),
        endDate: parseLocalToWallClockUTC(formData.endDate),
        publishedAt: formData.isPublished 
          ? (formData.publishedAt ? parseLocalToWallClockUTC(formData.publishedAt) : new Date())
          : null,
        onlyMembers: formData.onlyMembers,
        groups: selectedGroupId ? [selectedGroupId] : [],
        plugins: selectedPluginIds
      };


      if (action) {
        result = await updateAction(action.id, submissionData);
      } else {
        if (!projectId) {
          alert("Projeto não selecionado.");
          return;
        }
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

  const selectedGroup = availableGroups.find(g => g.id === selectedGroupId);
  const filteredGroups = availableGroups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

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

          {/* Group Linking (Moved below main info) */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                  <Users className="h-4 w-4" /> Vínculo com Grupo
                </h3>
                {selectedGroupId && (
                  <button
                    type="button"
                    onClick={() => setSelectedGroupId(null)}
                    className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                  >
                    (Desvincular)
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={toggleQuickCreate}
                className="text-[10px] font-bold text-brand-600 uppercase hover:underline"
              >
                {showQuickCreate ? "Voltar para Seleção" : "+ Criar Novo Grupo"}
              </button>
            </div>

            {showQuickCreate ? (
              <div className="p-6 bg-brand-50/30 dark:bg-brand-500/5 rounded-2xl border border-brand-100 dark:border-brand-500/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Grupo</label>
                  <input
                    type="text"
                    placeholder="Ex: Turma de Ética 2024"
                    value={newGroupData.name}
                    onChange={e => setNewGroupData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea
                    placeholder="Descreva o propósito deste grupo..."
                    value={newGroupData.description}
                    onChange={e => setNewGroupData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none font-medium text-sm"
                    rows={3}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleQuickCreate}
                  disabled={creatingGroup || !newGroupData.name.trim()}
                >
                  {creatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar e Vincular Agora"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List/Search */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Procurar grupo..."
                      value={groupSearch}
                      onChange={e => setGroupSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 max-h-[280px] overflow-y-auto space-y-1">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map(group => (
                        <label key={group.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition-all border border-transparent has-[:checked]:border-brand-200 has-[:checked]:bg-white dark:has-[:checked]:bg-gray-800 shadow-none has-[:checked]:shadow-sm">
                          <input
                            type="radio"
                            name="group-selection"
                            checked={selectedGroupId === group.id}
                            onChange={() => handleGroupSelect(group.id)}
                            className="rounded-full border-gray-300 text-brand-500 focus:ring-brand-500 h-4 w-4"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{group.name}</span>
                            <div className="flex items-center gap-2">
                              {!group.isVisible && <Badge variant="light" color="light" className="text-[8px] h-4 py-0 font-black uppercase">Oculto</Badge>}
                              <span className="text-[10px] text-gray-400 truncate">{group.description || "Sem descrição"}</span>
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <Search className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 italic">Nenhum grupo encontrado</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Group Details & Links */}
                <div className="flex flex-col">
                  {selectedGroup ? (
                    <div className="bg-brand-50/30 dark:bg-brand-500/5 rounded-2xl border border-brand-100 dark:border-brand-500/10 p-5 flex-1 animate-in fade-in duration-500">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 shrink-0">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-black text-brand-900 dark:text-brand-200 leading-tight truncate">{selectedGroup.name}</h4>
                          <p className="text-xs text-brand-700 dark:text-brand-400 line-clamp-2 mt-1">{selectedGroup.description || "Sem descrição informada para este grupo."}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest ml-1 mb-3">Links do Grupo</p>
                        <Link
                          href={`/adm/groups/${selectedGroup.id}/manage`}
                          className="flex items-center justify-between w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-brand-100 dark:border-brand-500/10 hover:border-brand-300 transition-all group"
                        >
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Gerenciar Participantes</span>
                          <ChevronLeft className="h-4 w-4 text-brand-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                          href={`/adm/groups/${selectedGroup.id}`}
                          className="flex items-center justify-between w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-brand-100 dark:border-brand-500/10 hover:border-brand-300 transition-all group"
                        >
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Configurações do Grupo</span>
                          <ChevronLeft className="h-4 w-4 text-brand-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center flex-1">
                      <Users className="h-10 w-10 text-gray-300 mb-2" />
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nenhum Grupo</h4>
                      <p className="text-[10px] text-gray-400 mt-2">Selecione um grupo da lista ao lado para vincular a esta ação.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">

          {/* Status & Access */}
          {/* // Configurações de Publicação e Acesso */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">Acesso e Publicação</h3>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="flex h-5 items-center">
                    <input
                      name="isPublished"
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                      className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      Publicado
                      {formData.isPublished && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </span>
                  </div>
                </label>

                {formData.isPublished && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Data de Publicação</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="datetime-local"
                        name="publishedAt"
                        value={formData.publishedAt}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 italic">Uma data futura agendará a publicação.</p>
                  </div>
                )}
                {!formData.isPublished && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10 transition-all">
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">A ação está <strong>desativada</strong> e não aparecerá para ninguém no projeto.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex h-5 items-center">
                    <input
                      name="onlyMembers"
                      type="checkbox"
                      checked={formData.onlyMembers}
                      onChange={handleInputChange}
                      className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      Somente Membros
                      {formData.onlyMembers ? <Users className="h-3 w-3 text-brand-500" /> : <Globe className="h-3 w-3 text-gray-400" />}
                    </span>
                    <span className="text-[11px] text-gray-500 leading-tight mt-1">
                      {formData.onlyMembers
                        ? "Listar apenas para usuários vinculados a algum grupo desta ação."
                        : "Visível para qualquer usuário com acesso ao Projeto."}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">Mídia da Ação</h3>

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

              <div className="space-y-2 mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagem de Fundo (Capa)</label>
                <div className="aspect-video relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
                  ) : formData.backgroundUrl ? (
                    <div className="group relative w-full h-full">
                      <img src={formData.backgroundUrl} alt="Preview Background" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, backgroundUrl: "" }))}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-center p-4 w-full h-full flex flex-col items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <span className="text-xs text-gray-400">Upload Imagem de Fundo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundUpload} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Plugins Linking */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recursos e Plugins</h3>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full dark:bg-brand-500/10">
                {selectedPluginIds.length} Ativo(s)
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrar plugins..."
                  value={pluginSearch}
                  onChange={(e) => setPluginSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-[11px] rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {availablePlugins
                  .filter(p => p.available && (p.name.toLowerCase().includes(pluginSearch.toLowerCase()) || p.description?.toLowerCase().includes(pluginSearch.toLowerCase())))
                  .map(plugin => {
                    const isSelected = selectedPluginIds.includes(plugin.id);
                    return (
                      <button
                        key={plugin.id}
                        type="button"
                        onClick={() => handlePluginToggle(plugin.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left group ${
                          isSelected 
                            ? "bg-brand-50 border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/30 shadow-sm" 
                            : "bg-white border-gray-100 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected 
                            ? "bg-white border-brand-200 text-brand-600 dark:bg-gray-800 dark:border-brand-500/30 dark:text-brand-400" 
                            : "bg-gray-50 border-gray-100 text-gray-400 dark:bg-gray-800 dark:border-gray-700"
                        }`}>
                          {plugin.imageUrl ? (
                            <img src={plugin.imageUrl} className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            <Puzzle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[11px] font-bold truncate uppercase italic ${isSelected ? "text-brand-900 dark:text-brand-100" : "text-gray-700 dark:text-gray-300"}`}>
                            {plugin.name}
                          </div>
                          <div className="text-[9px] text-gray-400 truncate font-medium">
                            {plugin.description || "Sem descrição"}
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected 
                            ? "bg-brand-500 border-brand-500 text-white" 
                            : "border-gray-200 dark:border-gray-700"
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                {availablePlugins.filter(p => (p as any).available).length === 0 && (
                  <div className="py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <Puzzle className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-[10px] text-gray-400 font-medium px-4">Nenhum plugin disponível no sistema.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
