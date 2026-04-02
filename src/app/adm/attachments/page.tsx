"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Link as LinkIcon, Youtube, Instagram, HardDrive, FileText, Edit, Trash2, Loader2, ExternalLink } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { getAttachments, deleteAttachment } from "@/actions/attachments";
import DeleteModal from "@/components/admin/content/DeleteModal";
import Pagination from "@/components/ui/pagination/Pagination";
import { useProject } from "@/context/ProjectContext";

export default function AttachmentsPage() {
  const [search, setSearch] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { projectId } = useProject();

  useEffect(() => {
    fetchAttachments();
  }, [projectId]);

  async function fetchAttachments() {
    if (!projectId) return;
    setLoading(true);
    const data = await getAttachments(projectId);
    setAttachments(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteAttachment(deleteId);
    await fetchAttachments();
    setIsDeleting(false);
    setDeleteId(null);
  }

  const filteredAttachments = attachments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.url.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedAttachments = filteredAttachments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'Vídeo do Youtube':
      case 'Canal do Youtube':
        return <Youtube className="h-5 w-5 text-red-500" />;
      case 'Perfil do Instagram':
      case 'Post do Instagram':
        return <Instagram className="h-5 w-5 text-pink-500" />;
      case 'Pasta do Google Drive':
      case 'Arquivo do Google Drive':
        return <HardDrive className="h-5 w-5 text-blue-500" />;
      case 'Arquivo PDF':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <LinkIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anexos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie links externos, vídeos, pastas e arquivos vinculados ao seu projeto.</p>
        </div>
        <Link href="/adm/attachments/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Anexo
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pelo título, URL ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium min-w-[200px]">Anexo</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium text-center">Vínculos</th>
                <th className="px-6 py-4 font-medium">URL</th>
                <th className="px-6 py-4 font-medium text-right w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Carregando anexos...
                  </td>
                </tr>
              ) : paginatedAttachments.map((attachment) => (
                <tr key={attachment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        {getAttachmentIcon(attachment.type)}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white max-w-[160px] md:max-w-xs lg:max-w-sm truncate" title={attachment.title}>
                        {attachment.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      {attachment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{attachment._count?.posts || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <a 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 hover:text-brand-500 transition-colors max-w-[150px] md:max-w-[200px] truncate"
                      title={attachment.url}
                    >
                      {attachment.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/adm/attachments/${attachment.id}`}>
                        <button className="p-2 text-gray-400 hover:text-brand-500 transition-colors" title="Editar">
                          <Edit className="h-4 w-4" />
                        </button>
                      </Link>
                      <button onClick={() => setDeleteId(attachment.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredAttachments.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhum anexo encontrado.
            </div>
          )}
        </div>

        {!loading && filteredAttachments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredAttachments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Anexo"
        description="Esta ação removerá permanentemente este anexo do seu projeto. Postagens vinculadas deixarão de exibir este anexo."
        loading={isDeleting}
      />
    </div>
  );
}
