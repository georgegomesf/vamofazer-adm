"use client";

import React, { useState, useEffect } from "react";
import { 
  Save, Loader2, FileText, Image as ImageIcon, Calendar, Tag as TagIcon, 
  Layout, ChevronLeft, Eye, Edit3, Trash2, Link as LinkIcon, Plus, 
  X as CloseIcon, Clock, ListTodo, Type, Paperclip 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { createPost, updatePost } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";
import { getAttachments } from "@/actions/attachments";
import { getActions } from "@/actions/actions";
import { uploadImage, deleteImage } from "@/actions/upload";
import QuickAttachmentModal from "./QuickAttachmentModal";
import QuickActionModal from "./QuickActionModal";

interface PostEditorProps {
  post?: any; // If provided, it's edit mode
}

export default function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [allAttachments, setAllAttachments] = useState<any[]>([]);
  const [allActions, setAllActions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    imageUrl: "",
    categoryId: "",
    tagIds: [] as string[],
    attachmentIds: [] as string[],
    actionIds: [] as string[],
    publishedAt: null as string | null,
  });

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  useEffect(() => {
    fetchData();
    if (post) {
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        summary: post.summary || "",
        content: post.content || "",
        imageUrl: post.imageUrl || "",
        categoryId: post.categoryId || "",
        tagIds: post.tags?.map((pt: any) => pt.tagId) || [],
        attachmentIds: post.attachments?.map((pa: any) => pa.attachmentId) || [],
        actionIds: post.actions?.map((pa: any) => pa.actionId) || [],
        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : null,
      });
    }
  }, [post]);

  async function fetchData() {
    const [cats, tags, atts, acts] = await Promise.all([
      getCategories(projectId),
      getTags(projectId),
      getAttachments(projectId),
      getActions(projectId)
    ]);
    setCategories(cats);
    setAllTags(tags);
    setAllAttachments(atts);
    setAllActions(acts);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "title" && !post) {
      const generatedSlug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      setFormData(prev => ({ ...prev, [name]: value, slug: generatedSlug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  const handleAttachmentToggle = (attachmentId: string) => {
    setFormData(prev => ({
      ...prev,
      attachmentIds: prev.attachmentIds.includes(attachmentId)
        ? prev.attachmentIds.filter(id => id !== attachmentId)
        : [...prev.attachmentIds, attachmentId]
    }));
  };

  const handleActionToggle = (actionId: string, type: string) => {
    setFormData(prev => {
      const isLinked = prev.actionIds.includes(actionId);
      
      if (isLinked) {
        return { ...prev, actionIds: prev.actionIds.filter(id => id !== actionId) };
      }

      // If it's Evento or Prazo, remove existing of same type
      let newIds = [...prev.actionIds];
      if (type === "Evento" || type === "Prazo") {
        const existingOfSameType = allActions.find(a => 
          prev.actionIds.includes(a.id) && a.type === type
        );
        if (existingOfSameType) {
          newIds = newIds.filter(id => id !== existingOfSameType.id);
        }
      }
      
      return { ...prev, actionIds: [...newIds, actionId] };
    });
  };

  const handleActionModalSuccess = async (actionId: string, type: string) => {
    await fetchData(); // Refresh list
    handleActionToggle(actionId, type);
  };

  const handleAttachmentModalSuccess = async (attachmentId: string) => {
    await fetchData(); // Refresh list
    setFormData(prev => ({
      ...prev,
      attachmentIds: [...prev.attachmentIds, attachmentId] // Automatically select it
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      if (formData.imageUrl && formData.imageUrl.includes("blob.vercel-storage.com")) {
        await deleteImage(formData.imageUrl);
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const blob = await uploadImage(formDataUpload);
      setFormData(prev => ({ ...prev, imageUrl: blob.url }));
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

    const submissionData = {
      ...formData,
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
    };

    console.log("PostEditor: Submitting...", submissionData);
    try {
      let result;
      if (post) {
        result = await updatePost(post.id, submissionData);
      } else {
        result = await createPost(projectId, submissionData);
      }

      console.log("PostEditor: Result received:", result);
      if (result.success) {
        console.log("PostEditor: Success! Redirecting...");
        router.push("/adm/posts");
      } else {
        console.error("PostEditor: Error result:", result.error);
        alert("Erro ao salvar postagem: " + result.error);
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Erro inesperado ao salvar postagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
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
              {post ? "Editar Postagem" : "Nova Postagem"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {post ? "Atualize o conteúdo da sua publicação." : "Conteúdo inédito para a rede."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "edit" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Edit3 className="h-4 w-4" /> Escrever
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "preview" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Eye className="h-4 w-4" /> Visualizar
            </button>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Título da Publicação"
                  className="w-full text-3xl font-bold bg-transparent outline-none border-none placeholder:text-gray-300 dark:text-white"
                  required
                />
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="font-mono">redefilosofica.com/</span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="url-da-postagem"
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 text-gray-600 dark:text-gray-400 w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumo / Subtítulo</label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-transparent focus:border-brand-500 outline-none transition-all dark:text-white resize-none"
                  placeholder="Do que se trata esta postagem?"
                />
              </div>

              {activeTab === "edit" ? (
                <div className="space-y-4">
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={15}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-transparent focus:border-brand-500 outline-none transition-all dark:text-white font-mono leading-relaxed"
                    placeholder="Escreva seu artigo aqui usando Markdown..."
                  />
                </div>
              ) : (
                <div className="min-h-[400px] bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap dark:text-gray-200">{formData.content || "Sem conteúdo para visualizar."}</div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-brand-500" />
              Imagem de Capa
            </h3>
            <div className="space-y-4">
              <div className="relative group aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                {formData.imageUrl ? (
                  <div className="relative w-full h-full group">
                    <img src={formData.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Ou cole uma URL</label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Layout className="h-5 w-5 text-brand-500" />
              Taxonomia
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">Sem Categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <TagIcon className="h-4 w-4" /> Etiquetas
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${formData.tagIds.includes(tag.id)
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                    >
                      {tag.title}
                    </button>
                  ))}
                  {allTags.length === 0 && <span className="text-xs text-gray-400 italic">Nenhuma etiqueta cadastrada.</span>}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Type className="h-5 w-5 text-brand-500" />
              Ações Vinculadas
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 pt-2">
                {allActions?.filter(act => formData.actionIds.includes(act.id)).map((act) => (
                  <div
                    key={act.id}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border shadow-sm flex items-center justify-between group
                      ${act.type === 'Evento' ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-500/10 dark:text-blue-300' : 
                        act.type === 'Prazo' ? 'bg-red-50 border-red-500 text-red-900 dark:bg-red-500/10 dark:text-red-300' : 
                        'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300'}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {act.type === 'Evento' ? <Calendar className="h-3.5 w-3.5" /> : 
                       act.type === 'Prazo' ? <Clock className="h-3.5 w-3.5" /> : 
                       <ListTodo className="h-3.5 w-3.5" />}
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="font-bold truncate">{act.title}</span>
                        <span className="opacity-60 text-[10px] truncate">{act.type}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleActionToggle(act.id, act.type)}
                      className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                      title="Remover vínculo"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {formData.actionIds.length === 0 && <span className="text-xs text-gray-400 italic">Nenhuma ação vinculada.</span>}
              </div>

              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsActionModalOpen(true)}
                  className="w-full text-xs py-2 h-auto flex items-center justify-center gap-2"
                >
                  <Plus className="h-3 w-3" /> Gerenciar Ações
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-brand-500" />
              Anexos Vinculados
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 pt-2">
                {allAttachments?.filter(att => formData.attachmentIds.includes(att.id)).map((att) => (
                  <div
                    key={att.id}
                    className="px-3 py-2 rounded-xl text-xs font-medium bg-brand-50 border border-brand-500 text-brand-900 dark:bg-brand-500/10 dark:text-brand-300 shadow-sm flex items-center justify-between group"
                  >
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="font-bold truncate">{att.title}</span>
                      <span className="opacity-60 text-[10px] truncate">{att.type}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAttachmentToggle(att.id)}
                      className="p-1 hover:bg-brand-500 hover:text-white rounded-lg transition-colors"
                      title="Remover vínculo"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {formData.attachmentIds.length === 0 && <span className="text-xs text-gray-400 italic">Nenhum anexo vinculado.</span>}
              </div>

              <div className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAttachmentModalOpen(true)}
                  className="w-full text-xs py-2 h-auto flex items-center justify-center gap-2"
                >
                  <Plus className="h-3 w-3" /> Gerenciar Anexos
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-500" />
              Status
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Publicação</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="publishedAt"
                    value={formData.publishedAt || ""}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                {!formData.publishedAt && <p className="text-[10px] text-gray-500 mt-1 italic">Vazio = Salvar como Rascunho</p>}
              </div>
            </div>
          </section>
        </div>
      </form>

      <QuickAttachmentModal 
        isOpen={isAttachmentModalOpen} 
        onClose={() => setIsAttachmentModalOpen(false)} 
        onSuccess={handleAttachmentModalSuccess}
        allAttachments={allAttachments}
        linkedAttachmentIds={formData.attachmentIds}
      />

      <QuickActionModal 
        isOpen={isActionModalOpen} 
        onClose={() => setIsActionModalOpen(false)} 
        onSuccess={handleActionModalSuccess}
        allActions={allActions}
        linkedActionIds={formData.actionIds}
      />
    </div>
  );
}
