"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Save, Upload, X, Check, Loader2, Globe, Mail, Image as ImageIcon, Layout, Menu as MenuIcon, User as UserIcon, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import Button from "@/components/ui/button/Button";
import { getProject, updateProject } from "@/actions/project";
import { uploadImage, deleteImage } from "@/actions/upload";
import { useProject as useProjectContext } from "@/context/ProjectContext";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  logoHorizontalUrl: string | null;
  coverUrl: string | null;
  backgroundUrl: string | null;
  link: string | null;
  email: string | null;
  defaultEntryRole: string;
  heroVisible: boolean;
  newArrivalsVisible: boolean;
  countdownVisible: boolean;
  bestSellersVisible: boolean;
  searchVisible: boolean;
  heroLabel: string;
  newArrivalsLabel: string;
  countdownLabel: string;
  bestSellersLabel: string;
  searchLabel: string;
  searchViewType: string;
  homeSectionOrder: any;
  defaultThumbUrl: string | null;
}

const DEFAULT_HOME_ORDER = ["search", "hero", "newArrivals", "countdown", "bestSellers"];

const SECTION_LABELS: Record<string, string> = {
  search: "Pesquisa",
  hero: "Carrossel e Calendário",
  newArrivals: "Agenda",
  countdown: "Contagem Regressiva",
  bestSellers: "Veja também"
};

function SortableItem({ id, label, isVisible, moveUp, moveDown, index, totalItems }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-shadow ${isDragging ? 'shadow-xl ring-2 ring-brand-500/20' : ''} ${!isVisible ? 'opacity-50 grayscale' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div 
          {...attributes} 
          {...listeners} 
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-grab active:cursor-grabbing text-gray-400"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-1 sm:hidden">
          <button type="button" onClick={moveUp} disabled={index === 0} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30">
            <ArrowUp className="h-3 w-3" />
          </button>
          <button type="button" onClick={moveDown} disabled={index === totalItems - 1} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30">
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      {!isVisible && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded">Inativo</span>}
    </div>
  );
}

export default function ProjetoPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { projectId } = useProjectContext();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function fetchProject() {
    if (!projectId) return;
    setLoading(true);
    const data = await getProject(projectId);
    if (data) {
      setProject({
        ...data,
        heroVisible: !!data.heroVisible,
        newArrivalsVisible: !!data.newArrivalsVisible,
        countdownVisible: !!data.countdownVisible,
        bestSellersVisible: !!data.bestSellersVisible,
        searchVisible: data.searchVisible ?? true,
        heroLabel: data.heroLabel ?? "",
        newArrivalsLabel: data.newArrivalsLabel ?? "",
        countdownLabel: data.countdownLabel ?? "",
        bestSellersLabel: data.bestSellersLabel ?? "",
        searchLabel: data.searchLabel ?? "",
        searchViewType: data.searchViewType ?? "grid",
        homeSectionOrder: data.homeSectionOrder || DEFAULT_HOME_ORDER,
        defaultThumbUrl: data.defaultThumbUrl ?? null,
      } as any);
    }
    setLoading(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!project) return;
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setProject({ ...project, [name]: checked } as any);
    } else {
      setProject({ ...project, [name]: value } as any);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setSaving(true);
    try {
      // 1. Delete old image from blob if it exists
      const oldUrl = (project as any)[field];
      if (oldUrl && oldUrl.includes("blob.vercel-storage.com")) {
        await deleteImage(oldUrl);
      }

      // 2. Upload new image
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const blob = await uploadImage(formDataUpload);
      
      setProject({ ...project, [field]: blob.url } as any);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ type: "error", text: "Falha no upload da imagem." });
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (field: string) => {
    if (!project) return;
    const oldUrl = (project as any)[field];
    if (oldUrl && oldUrl.includes("blob.vercel-storage.com")) {
      await deleteImage(oldUrl);
    }
    setProject({ ...project, [field]: null } as any);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!project) return;

    setSaving(true);
    setMessage(null);

    try {
      const result = await updateProject(projectId, project);
      if (result.success) {
        setMessage({ type: "success", text: "Projeto atualizado com sucesso!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Erro ao salvar alterações: " + result.error });
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setMessage({ type: "error", text: "Erro ao atualizar projeto." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projeto</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure as informações básicas e identidade visual do seu projeto.</p>
        </div>
        <Button
          onClick={() => handleSubmit()}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === "success"
          ? "bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
          : "bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
          }`}>
          {message.type === "success" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Layout className="h-5 w-5 text-brand-500" />
            Informações Gerais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título do Projeto</label>
              <input
                type="text"
                name="name"
                value={project.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="Ex: Meu Projeto"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Link do Site
              </label>
              <input
                type="url"
                name="link"
                value={project.link || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="https://exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email de Contato
              </label>
              <input
                type="email"
                name="email"
                value={project.email || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="contato@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Perfil Padrão de Cadastro
              </label>
              <select
                name="defaultEntryRole"
                value={project.defaultEntryRole}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="visitor">Visitante</option>
                <option value="member">Membro</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
              <textarea
                name="description"
                value={project.description || ""}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                placeholder="Uma breve descrição sobre o projeto..."
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-brand-500" />
            Identidade Visual
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Logo (Quadrada/Principal)
                </label>
                {project.logoUrl && (
                  <button type="button" onClick={() => removeImage("logoUrl")} className="text-red-500 hover:text-red-600 text-xs font-medium">Excluir</button>
                )}
              </div>
              <div className="relative group aspect-square max-w-[200px] mx-auto overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                {project.logoUrl ? (
                  <img src={project.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                ) : (
                  <MenuIcon className="h-10 w-10 text-gray-300" />
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white p-2 rounded-full shadow-lg">
                    <Upload className="h-5 w-5 text-gray-900" />
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "logoUrl")} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Logo Horizontal
                </label>
                {project.logoHorizontalUrl && (
                  <button type="button" onClick={() => removeImage("logoHorizontalUrl")} className="text-red-500 hover:text-red-600 text-xs font-medium">Excluir</button>
                )}
              </div>
              <div className="relative group aspect-video max-w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                {project.logoHorizontalUrl ? (
                  <img src={project.logoHorizontalUrl} alt="Logo Horizontal Preview" className="w-full h-full object-contain p-4" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white p-2 rounded-full shadow-lg">
                    <Upload className="h-5 w-5 text-gray-900" />
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "logoHorizontalUrl")} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Capa do Projeto</label>
                {project.coverUrl && (
                  <button type="button" onClick={() => removeImage("coverUrl")} className="text-red-500 hover:text-red-600 text-xs font-medium">Excluir</button>
                )}
              </div>
              <div className="relative group aspect-[21/9] w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                {project.coverUrl ? (
                  <img src={project.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <span className="text-xs text-gray-400">Recomendado: 1920x800px</span>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 font-medium">
                    <Upload className="h-4 w-4" /> Alterar Capa
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "coverUrl")} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail Padrão (Grid)</label>
                  <p className="text-xs text-gray-400 mt-0.5">Exibida em cards quando a postagem não possui imagem própria.</p>
                </div>
                {project.defaultThumbUrl && (
                  <button type="button" onClick={() => removeImage("defaultThumbUrl")} className="text-red-500 hover:text-red-600 text-xs font-medium">Excluir</button>
                )}
              </div>
              <div className="relative group aspect-square max-w-[200px] overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                {project.defaultThumbUrl ? (
                  <img src={project.defaultThumbUrl} alt="Thumbnail Padrão" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <span className="text-xs text-gray-400">Sem imagem padrão</span>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white p-2 rounded-full shadow-lg">
                    <Upload className="h-5 w-5 text-gray-900" />
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "defaultThumbUrl")} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </section>
  
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Layout className="h-5 w-5 text-brand-500" />
            Personalização da Home
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <input
                type="checkbox"
                id="heroVisible"
                name="heroVisible"
                checked={project.heroVisible}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="heroVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Exibir Carrossel e Calendário
              </label>
              <input
                type="text"
                name="heroLabel"
                value={project.heroLabel || ""}
                onChange={handleInputChange}
                className="flex-1 ml-4 px-3 py-1 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                placeholder="Nome da seção"
              />
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <input
                type="checkbox"
                id="newArrivalsVisible"
                name="newArrivalsVisible"
                checked={project.newArrivalsVisible}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="newArrivalsVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Exibir Agenda
              </label>
              <input
                type="text"
                name="newArrivalsLabel"
                value={project.newArrivalsLabel || ""}
                onChange={handleInputChange}
                className="flex-1 ml-4 px-3 py-1 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                placeholder="Nome da seção"
              />
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <input
                type="checkbox"
                id="countdownVisible"
                name="countdownVisible"
                checked={project.countdownVisible}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="countdownVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Exibir Contagem Regressiva
              </label>
              <input
                type="text"
                name="countdownLabel"
                value={project.countdownLabel || ""}
                onChange={handleInputChange}
                className="flex-1 ml-4 px-3 py-1 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                placeholder="Nome da seção"
              />
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <input
                type="checkbox"
                id="bestSellersVisible"
                name="bestSellersVisible"
                checked={project.bestSellersVisible}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="bestSellersVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Exibir Veja também
              </label>
              <input
                type="text"
                name="bestSellersLabel"
                value={project.bestSellersLabel || ""}
                onChange={handleInputChange}
                className="flex-1 ml-4 px-3 py-1 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                placeholder="Nome da seção"
              />
            </div>
            <div className="flex flex-col gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="searchVisible"
                  name="searchVisible"
                  checked={project.searchVisible}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="searchVisible" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Exibir Pesquisa
                </label>
                <input
                  type="text"
                  name="searchLabel"
                  value={project.searchLabel || ""}
                  onChange={handleInputChange}
                  className="flex-1 ml-4 px-3 py-1 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Nome da seção"
                />
              </div>
              <div className="flex items-center gap-3 pl-8">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tipo de visualização dos resultados:</label>
                <select
                  name="searchViewType"
                  value={project.searchViewType}
                  onChange={handleInputChange}
                  className="px-3 py-1 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="grid">Grid (Cards)</option>
                  <option value="list">Lista (Compacto)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Ordenação das Seções</h3>
            <p className="text-xs text-gray-500 mb-6">Mova as seções para alterar a ordem em que aparecem na home do site.</p>
            
            <div className="space-y-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (active.id !== over?.id) {
                    const oldIndex = project.homeSectionOrder.indexOf(active.id);
                    const newIndex = project.homeSectionOrder.indexOf(over?.id);
                    setProject({
                      ...project,
                      homeSectionOrder: arrayMove(project.homeSectionOrder, oldIndex, newIndex)
                    });
                  }
                }}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={project.homeSectionOrder || DEFAULT_HOME_ORDER}
                  strategy={verticalListSortingStrategy}
                >
                  {(project.homeSectionOrder || DEFAULT_HOME_ORDER).map((sectionId: string, index: number) => {
                    const label = (project as any)[`${sectionId}Label`] || SECTION_LABELS[sectionId] || sectionId;
                    const isVisible = (project as any)[`${sectionId}Visible`] !== false;
                    
                    const moveUp = () => {
                      if (index === 0) return;
                      const newOrder = [...project.homeSectionOrder];
                      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                      setProject({ ...project, homeSectionOrder: newOrder });
                    };
                    
                    const moveDown = () => {
                      if (index === project.homeSectionOrder.length - 1) return;
                      const newOrder = [...project.homeSectionOrder];
                      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                      setProject({ ...project, homeSectionOrder: newOrder });
                    };

                    return (
                      <SortableItem
                        key={sectionId}
                        id={sectionId}
                        label={label}
                        isVisible={isVisible}
                        index={index}
                        totalItems={project.homeSectionOrder.length}
                        moveUp={moveUp}
                        moveDown={moveDown}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto min-w-[200px]"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </span>
            ) : (
              "Salvar Todas as Alterações"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
