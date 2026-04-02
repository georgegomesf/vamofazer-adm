"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Calendar, Edit, Trash2, Loader2, Filter, ExternalLink } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { getPosts, deletePost } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import DeleteModal from "@/components/admin/content/DeleteModal";
import Pagination from "@/components/ui/pagination/Pagination";
import { useProject } from "@/context/ProjectContext";

export default function PostsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const webUrl = process.env.NEXT_PUBLIC_WEB_SERVICE_URL || "http://localhost:3000";

  const { projectId } = useProject();

  useEffect(() => {
    fetchPosts();
  }, [currentPage, search, statusFilter, categoryFilter, projectId]);

  useEffect(() => {
    async function loadCategories() {
      const data = await getCategories(projectId);
      setCategories(data);
    }
    loadCategories();
  }, [projectId]);

  async function fetchPosts() {
    if (!projectId) return;
    setLoading(true);
    const result = await getPosts(projectId, {
      page: currentPage,
      pageSize: itemsPerPage,
      search: search,
      status: statusFilter,
      categoryId: categoryFilter
    });
    setPosts(result.posts);
    setTotal(result.total);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await deletePost(deleteId);
    await fetchPosts();
    setIsDeleting(false);
    setDeleteId(null);
  }

  // Reset page when filtering
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [search, statusFilter, categoryFilter]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Postagens</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie os artigos, notícias e conteúdos do seu projeto.</p>
        </div>
        <Link href="/adm/posts/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Postagem
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pelo título ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium min-w-[240px]">Postagem</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Publicação</th>
                <th className="px-6 py-4 font-medium text-right w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Carregando postagens...
                  </td>
                </tr>
              ) : posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        {post.imageUrl ? (
                          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="max-w-[160px] md:max-w-xs lg:max-w-sm">
                        <div className="font-medium text-gray-900 dark:text-white truncate" title={post.title}>{post.title}</div>
                        <div className="text-sm text-gray-500 truncate font-mono text-[10px]" title={post.slug}>{post.slug}</div>
                        {post.authorName && (
                          <div className="text-[10px] text-brand-600 dark:text-brand-400 font-bold truncate">Por {post.authorName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[140px]">
                      <div className="text-gray-900 dark:text-gray-300 truncate font-medium text-xs" title={post.categories?.map((pc: any) => pc.category.title).join(", ") || "-"}>
                        {post.categories?.map((pc: any) => pc.category.title).join(", ") || "-"}
                      </div>

                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.publishedAt
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400'
                      }`}>
                      {post.publishedAt ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {post.publishedAt ? (
                        <div className="flex flex-col">
                          <span>{(() => {
                            const val = post.publishedAt;
                            const d = (typeof val === 'string' && !val.includes('Z') && !val.includes('+')) ? new Date(val + 'Z') : new Date(val);
                            return d.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
                          })()}</span>
                          <span className="text-[10px] opacity-70">
                            {(() => {
                              const val = post.publishedAt;
                              const d = (typeof val === 'string' && !val.includes('Z') && !val.includes('+')) ? new Date(val + 'Z') : new Date(val);
                              return d.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                            })()}
                          </span>
                        </div>
                      ) : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a 
                        href={`${webUrl}/p/${post.slug}${(!post.publishedAt || new Date(post.publishedAt) > new Date()) ? '?preview=true' : ''}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors" 
                        title={(!post.publishedAt || new Date(post.publishedAt) > new Date()) ? "Visualizar no Site (Preview)" : "Acessar no Site"}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Link href={`/adm/posts/${post.id}`}>
                        <button className="p-2 text-gray-400 hover:text-brand-500 transition-colors" title="Editar">
                          <Edit className="h-4 w-4" />
                        </button>
                      </Link>
                      <button onClick={() => setDeleteId(post.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && posts.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhuma postagem encontrada.
            </div>
          )}
        </div>

          {!loading && total > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
      </div>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Postagem"
        description="Esta ação removerá permanentemente este conteúdo do seu projeto. Imagens associadas também serão excluídas."
        loading={isDeleting}
      />
    </div>
  );
}
