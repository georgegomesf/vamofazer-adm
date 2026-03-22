"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Save, Upload, X, Check, Loader2, Globe, Mail, Image as ImageIcon, Layout, Menu as MenuIcon, User as UserIcon, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { getProject, updateProject } from "@/actions/project";
import { uploadImage, deleteImage } from "@/actions/upload";

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
}

export default function ProjetoPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  useEffect(() => {
    fetchProject();
  }, []);

  async function fetchProject() {
    setLoading(true);
    const data = await getProject(projectId);
    setProject(data as any);
    setLoading(false);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!project) return;
    const { name, value } = e.target;
    setProject({ ...project, [name]: value } as any);
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Background Personalizado</label>
                {project.backgroundUrl && (
                  <button type="button" onClick={() => removeImage("backgroundUrl")} className="text-red-500 hover:text-red-600 text-xs font-medium">Excluir</button>
                )}
              </div>
              <div className="relative group aspect-[21/9] w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                {project.backgroundUrl ? (
                  <img src={project.backgroundUrl} alt="Background Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <span className="text-xs text-gray-400">Recomendado: Imagem em alta definição</span>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 font-medium">
                    <Upload className="h-4 w-4" /> Alterar Background
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "backgroundUrl")} className="hidden" />
                </label>
              </div>
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
