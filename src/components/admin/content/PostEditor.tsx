"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, ChevronLeft, Image as ImageIcon, Layout, Tag as TagIcon, Plus, X as CloseIcon, Trash2, Paperclip, Type, Calendar, Send, ExternalLink as ExternalLinkIcon, Link as LinkIcon, Clock, ListTodo, Search, Book, Layers, FileText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { createPost, updatePost } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags, createTag } from "@/actions/tags";
import { getAttachments } from "@/actions/attachments";
import { getActions } from "@/actions/actions";
import { uploadImage, deleteImage } from "@/actions/upload";
import QuickAttachmentModal from "./QuickAttachmentModal";
import QuickActionModal from "./QuickActionModal";
import QuickLibraryModal from "./QuickLibraryModal";
import { getJournals, getIssues, getArticles, getJournal, getIssue, getArticle } from "@/actions/library";
import { createAttachment } from "@/actions/attachments";

interface PostEditorProps {
  post?: any; // If provided, it's edit mode
  projectId: string;
}

export default function PostEditor({ post, projectId }: PostEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [allAttachments, setAllAttachments] = useState<any[]>([]);
  const [allActions, setAllActions] = useState<any[]>([]);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const webUrl = process.env.NEXT_PUBLIC_WEB_SERVICE_URL || "http://localhost:3000";

  const [allJournals, setAllJournals] = useState<any[]>([]);
  const [allIssues, setAllIssues] = useState<any[]>([]);
  const [allArticles, setAllArticles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    imageUrl: "",
    tagIds: [] as string[],
    categoryIds: [] as string[],
    attachmentIds: [] as string[],
    actionIds: [] as string[],
    journalIds: [] as string[],
    issueIds: [] as string[],
    articleIds: [] as string[],
    publishedAt: null as string | null,
    authorName: "",
  });

  const hasImported = React.useRef(false);

  // Local helper to format date for datetime-local input
  const formatToLocalDatetime = (date: Date | string | null) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      const z = d.getTimezoneOffset() * 60 * 1000;
      const localDate = new Date(d.getTime() - z);
      return localDate.toISOString().slice(0, 16);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    fetchData();

    if (post) {
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        summary: post.summary || "",
        content: post.content || "",
        imageUrl: post.imageUrl || "",
        categoryIds: post.categories?.filter((pc: any) => pc.category).map((pc: any) => pc.categoryId) || [],
        tagIds: post.tags?.filter((pt: any) => pt.tag).map((pt: any) => pt.tagId) || [],
        attachmentIds: post.attachments?.filter((pa: any) => pa.attachment).map((pa: any) => pa.attachmentId) || [],
        actionIds: post.actions?.filter((pa: any) => pa.action).map((pa: any) => pa.actionId) || [],
        journalIds: post.postJournals?.filter((pj: any) => pj.journal).map((pj: any) => pj.journalId) || [],
        issueIds: post.postIssues?.filter((pi: any) => pi.issue).map((pi: any) => pi.issueId) || [],
        articleIds: post.postArticles?.filter((pa: any) => pa.article).map((pa: any) => pa.articleId) || [],
        publishedAt: formatToLocalDatetime(post.publishedAt) || null,
        authorName: post.authorName || "",
      });
    } else {
      // Check for URL-based import (from Bookmarklet or Library)
      const importTitle = searchParams.get("title");
      const importSummary = searchParams.get("summary") || "";
      const importImageUrl = searchParams.get("imageUrl") || "";
      const importSourceUrl = searchParams.get("sourceUrl");
      const importEmbedUrl = searchParams.get("embedUrl");

      const libImportType = searchParams.get("importType");
      const libImportId = searchParams.get("importId");

      const handleImport = async () => {
        if (hasImported.current) return;
        hasImported.current = true;

        if (libImportType && libImportId) {
          setLoading(true);
          try {
            let data: any = null;
            if (libImportType === "journal") {
              data = await getJournal(libImportId);
              if (data) {
                const generatedSlug = data.title
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^\w\s-]/g, "")
                  .replace(/\s+/g, "-");

                setFormData(prev => ({
                  ...prev,
                  title: data.title,
                  slug: generatedSlug,
                  summary: data.description || "",
                  content: (data.description || "") + (data.link ? `\n\nFonte: [${data.link}](${data.link})` : ""),
                  journalIds: [data.id],
                }));
              }
            } else if (libImportType === "issue") {
              data = await getIssue(libImportId);
              if (data) {
                const generatedSlug = data.title
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^\w\s-]/g, "")
                  .replace(/\s+/g, "-");

                setFormData(prev => ({
                  ...prev,
                  title: data.title,
                  slug: generatedSlug,
                  summary: data.description || "",
                  content: (data.description || "") + (data.link ? `\n\nFonte: [${data.link}](${data.link})` : ""),
                  imageUrl: data.coverUrl || "",
                  issueIds: [data.id],
                  journalIds: data.journalId ? [data.journalId] : [],
                  publishedAt: formatToLocalDatetime(data.datePublished) || null,
                }));
              }
            } else if (libImportType === "article") {
              data = await getArticle(libImportId);
              if (data) {
                const generatedSlug = data.title
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^\w\s-]/g, "")
                  .replace(/\s+/g, "-");

                const journalTitle = data.issue?.journal?.title || "";
                const vol = data.issue?.volume ? `v. ${data.issue.volume}` : "";
                const num = data.issue?.number ? `n. ${data.issue.number}` : "";
                const pages = data.pages ? `p. ${data.pages}` : "";
                const year = data.issue?.year || "";

                const abntRef = [journalTitle, vol, num, pages, year].filter(Boolean).join(", ") + ".";
                const sourceLink = data.url || (data.doi ? `https://doi.org/${data.doi}` : null);

                // Summary: First 200 characters of abstract
                const summary = data.abstract ? (data.abstract.length > 200 ? data.abstract.substring(0, 197) + "..." : data.abstract) : "";

                // Build content elements
                let content = "";
                if (data.keywords) {
                  content += `**Palavras-chave:** ${data.keywords}\n\n`;
                }
                content += data.abstract || "";
                if (abntRef) {
                  content += `\n\n${abntRef}`;
                }
                if (sourceLink) {
                  content += `\n\nFonte: [${sourceLink}](${sourceLink})`;
                }

                setFormData(prev => ({
                  ...prev,
                  title: data.title,
                  slug: generatedSlug,
                  summary: summary,
                  content: content,
                  articleIds: [data.id],
                  issueIds: [data.issueId],
                  publishedAt: formatToLocalDatetime(data.datePublished) || null,
                  authorName: data.authors || "",
                }));
              }
            }
          } catch (error) {
            console.error("Library import failed:", error);
          } finally {
            setLoading(false);
          }
          return;
        }

        const importAuthor = searchParams.get("author") || "";

        if (importTitle) {
          const generatedSlug = importTitle
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

          let initialContent = "";
          if (importEmbedUrl) {
            initialContent = `<iframe src="${importEmbedUrl}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>\n\n`;
          }
          if (importSourceUrl) {
            initialContent += `Fonte: [${importSourceUrl}](${importSourceUrl})`;
          }

          setFormData(prev => ({
            ...prev,
            title: importTitle,
            slug: generatedSlug,
            summary: importSummary,
            imageUrl: importImageUrl,
            content: initialContent,
            authorName: importAuthor,
            publishedAt: formatToLocalDatetime(searchParams.get("publishedAt")) || null,
          }));
        }
      };

      handleImport();
    }
  }, [post, searchParams]);

  async function fetchData() {
    const [cats, tags, atts, acts, journals, issues, articles] = await Promise.all([
      getCategories(projectId),
      getTags(projectId),
      getAttachments(projectId),
      getActions(projectId),
      getJournals(),
      getIssues({ pageSize: 100 }), // Fetch some to have for lookup
      getArticles({ pageSize: 100 })
    ]);
    setCategories(cats);
    setAllTags(tags);
    setAllAttachments(atts);
    setAllActions(acts);
    setAllJournals(journals);
    setAllIssues(issues.issues || []);
    setAllArticles(articles.articles || []);
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

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
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
    await fetchData();
    handleActionToggle(actionId, type);
  };

  const handleAttachmentModalSuccess = async (attachmentId: string) => {
    await fetchData();
    setFormData(prev => ({
      ...prev,
      attachmentIds: [...prev.attachmentIds, attachmentId]
    }));
  };

  const handleLibraryLink = (id: string, type: 'journal' | 'issue' | 'article') => {
    const fieldName = type === 'journal' ? 'journalIds' : type === 'issue' ? 'issueIds' : 'articleIds';
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...(prev as any)[fieldName], id]
    }));
    fetchData(); // Refresh list to get names if needed
  };

  const handleLibraryToggle = (id: string, type: 'journal' | 'issue' | 'article') => {
    const fieldName = type === 'journal' ? 'journalIds' : type === 'issue' ? 'issueIds' : 'articleIds';
    setFormData(prev => ({
      ...prev,
      [fieldName]: (prev as any)[fieldName].filter((i: string) => i !== id)
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

  const handleSubmit = async (e?: React.FormEvent, explicitPublishedAt?: string | null) => {
    e?.preventDefault();
    setLoading(true);

    const pubAt = (explicitPublishedAt !== undefined ? explicitPublishedAt : formData.publishedAt) as string | null;
    let publishedAtIso: string | null = null;
    if (pubAt) {
      try {
        if (pubAt.length === 16 && !pubAt.includes("Z")) {
          publishedAtIso = new Date(pubAt + ":00Z").toISOString();
        } else {
          publishedAtIso = new Date(pubAt).toISOString();
        }
      } catch (e) {
        console.error("Invalid date:", pubAt);
        publishedAtIso = null;
      }
    }

    const submissionData = {
      ...formData,
      publishedAt: publishedAtIso,
    };

    try {
      let result;
      if (post) {
        result = await updatePost(post.id, submissionData);
      } else {
        result = await createPost(projectId, submissionData);
      }

      if (result.success) {
        router.push("/adm/posts");
      } else {
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
          {formData.slug && (
            <a
              href={`${webUrl}/p/${formData.slug}${(!formData.publishedAt || new Date(formData.publishedAt) > new Date()) ? '?preview=true' : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-medium gap-2 px-5 py-3.5 text-sm rounded-lg transition bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
            >
              <ExternalLinkIcon className="h-4 w-4" /> Visualizar
            </a>
          )}

          <Button
            variant="outline"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>

          {!post?.publishedAt ? (
            <Button
              onClick={async (e) => {
                const now = new Date();
                const pad = (n: number) => n.toString().padStart(2, '0');
                const nowStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${now.getUTCDate() < 10 ? '0' + now.getUTCDate() : now.getUTCDate()}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;

                const targetDate = formData.publishedAt || nowStr;
                setFormData(prev => ({ ...prev, publishedAt: targetDate }));

                // Wait a tick for state to update before submit
                setTimeout(() => {
                  const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
                  handleSubmit(fakeEvent, targetDate);
                }, 10);
              }}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 border-none px-6"
            >
              <Send className="h-4 w-4" /> Publicar
            </Button>
          ) : (
            <Button
              onClick={async () => {
                setFormData(prev => ({ ...prev, publishedAt: null }));
                setTimeout(() => {
                  const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
                  handleSubmit(fakeEvent, null);
                }, 10);
              }}
              disabled={loading}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 border-none text-white px-6"
            >
              <CloseIcon className="h-4 w-4" /> Retirar
            </Button>
          )}
        </div>
      </div>

      {/* Import source banner */}
      {!post && searchParams.get("sourceUrl") && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-sm">
          <LinkIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-blue-700 dark:text-blue-300">
            Postagem criada a partir de:{" "}
            <a
              href={searchParams.get("sourceUrl")!}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:no-underline truncate max-w-xs inline-block align-bottom"
            >
              {searchParams.get("sourceUrl")}
            </a>
          </span>
        </div>
      )}

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
                  <span className="font-mono">{process.env.NEXT_PUBLIC_BASE_URL}/</span>
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
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Autor</label>
                <input
                  type="text"
                  name="authorName"
                  value={formData.authorName}
                  onChange={handleInputChange}
                  placeholder="Nome do autor (opcional)"
                  className="w-full bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-transparent focus:border-brand-500 outline-none transition-all dark:text-white"
                />
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

              <div className="space-y-4">
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={20}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-transparent focus:border-brand-500 outline-none transition-all dark:text-white font-mono leading-relaxed"
                  placeholder="Escreva seu artigo aqui usando Markdown..."
                />
              </div>
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
                  <div className="relative w-full h-full group flex items-center justify-center">
                    <img src={formData.imageUrl} alt="Cover Preview" className="w-full h-full object-contain object-center" />
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
              Categorias
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${formData.categoryIds.includes(cat.id)
                      ? "bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/20"
                      : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                      }`}
                  >
                    {cat.title}
                  </button>
                ))}
                {categories.length === 0 && <span className="text-xs text-gray-400 italic">Nenhuma categoria cadastrada.</span>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-brand-500" /> Etiquetas
            </h3>
            <div className="space-y-4">
              <div className="relative group">
                <div className="flex bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-transparent focus-within:border-brand-500 transition-all items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400 ml-1" />
                  <input
                    type="text"
                    placeholder="Pesquisar etiqueta..."
                    className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
                    onChange={(e) => {
                      const val = e.target.value;
                      setTagSearch(val);
                      setTagDropdownOpen(val.length > 0);
                    }}
                    value={tagSearch}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagSearch.trim()) {
                        e.preventDefault();
                        const exactMatch = allTags.find(t => t.title.toLowerCase() === tagSearch.toLowerCase());
                        if (exactMatch && !formData.tagIds.includes(exactMatch.id)) {
                          handleTagToggle(exactMatch.id);
                          setTagSearch("");
                          setTagDropdownOpen(false);
                        }
                      }
                    }}
                  />
                </div>

                {tagDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      {allTags
                        .filter(t => t.title.toLowerCase().includes(tagSearch.toLowerCase()) && !formData.tagIds.includes(t.id))
                        .map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              handleTagToggle(tag.id);
                              setTagSearch("");
                              setTagDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:text-gray-200 transition-colors flex items-center justify-between"
                          >
                            <span>{tag.title}</span>
                            <Plus className="h-3 w-3 opacity-40" />
                          </button>
                        ))}

                      {tagSearch && !allTags.some(t => t.title.toLowerCase() === tagSearch.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const slug = tagSearch.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                            const res = await createTag(projectId, { title: tagSearch, slug });
                            if (res.success && res.tag) {
                              await fetchData();
                              handleTagToggle(res.tag.id);
                              setTagSearch("");
                              setTagDropdownOpen(false);
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-sm border-t border-gray-50 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Criar nova etiqueta: <span className="font-bold">"{tagSearch}"</span></span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {allTags.filter(t => formData.tagIds.includes(t.id)).map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500 text-white text-[10px] font-bold shadow-sm"
                  >
                    {tag.title}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Type className="h-5 w-5 text-brand-500" />
              Ações
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
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsActionModalOpen(true)}
                className="w-full text-xs py-2 h-auto flex items-center justify-center gap-2"
              >
                <Plus className="h-3 w-3" /> Gerenciar Ações
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-brand-500" />
              Anexos
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
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAttachmentModalOpen(true)}
                className="w-full text-xs py-2 h-auto flex items-center justify-center gap-2"
              >
                <Plus className="h-3 w-3" /> Gerenciar Anexos
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Book className="h-5 w-5 text-brand-500" />
              Biblioteca
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 pt-2">
                {/* Journals */}
                {allJournals?.filter(j => formData.journalIds.includes(j.id)).map((j) => (
                  <div key={j.id} className="px-3 py-2 rounded-xl text-xs font-medium bg-indigo-50 border border-indigo-500 text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Book className="h-3.5 w-3.5" />
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="font-bold truncate" title={j.title}>{j.title}</span>
                        <span className="opacity-60 text-[10px]">Revista</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleLibraryToggle(j.id, 'journal')} className="p-1 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors">
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {/* Issues */}
                {allIssues?.filter(i => formData.issueIds.includes(i.id)).map((i) => (
                  <div key={i.id} className="px-3 py-2 rounded-xl text-xs font-medium bg-amber-50 border border-amber-500 text-amber-900 dark:bg-amber-500/10 dark:text-amber-300 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Layers className="h-3.5 w-3.5" />
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="font-bold truncate" title={i.title}>{i.title}</span>
                        <span className="opacity-60 text-[10px]">Edição • {i.journal?.title}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleLibraryToggle(i.id, 'issue')} className="p-1 hover:bg-amber-500 hover:text-white rounded-lg transition-colors">
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {/* Articles */}
                {allArticles?.filter(a => formData.articleIds.includes(a.id)).map((a) => (
                  <div key={a.id} className="px-3 py-2 rounded-xl text-xs font-medium bg-emerald-50 border border-emerald-500 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-3.5 w-3.5" />
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="font-bold truncate" title={a.title}>{a.title}</span>
                        <span className="opacity-60 text-[10px]">Artigo • {a.authors}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleLibraryToggle(a.id, 'article')} className="p-1 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors">
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLibraryModalOpen(true)}
                className="w-full text-xs py-2 h-auto flex items-center justify-center gap-2"
              >
                <Plus className="h-3 w-3" /> Gerenciar Biblioteca
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-500" />
              Programar
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Publicação</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    name="publishedAt"
                    value={formData.publishedAt || ""}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                {formData.publishedAt ? (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, publishedAt: null }))}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold mt-2 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Limpar
                  </button>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-1 italic">Status atual: RASCUNHO (Privado)</p>
                )}
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

      <QuickLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSuccess={handleLibraryLink}
        linkedJournalIds={formData.journalIds}
        linkedIssueIds={formData.issueIds}
        linkedArticleIds={formData.articleIds}
      />
    </div>
  );
}
