"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Book, Edit, Trash2, Loader2, ExternalLink } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { getJournals, deleteJournal } from "@/actions/library";
import DeleteModal from "@/components/admin/content/DeleteModal";
import Pagination from "@/components/ui/pagination/Pagination";

export default function JournalsPage() {
  const [search, setSearch] = useState("");
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchJournals();
  }, []);

  async function fetchJournals() {
    setLoading(true);
    const data = await getJournals();
    setJournals(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteJournal(deleteId);
    await fetchJournals();
    setIsDeleting(false);
    setDeleteId(null);
  }

  const filteredJournals = journals.filter(j => 
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.link && j.link.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedJournals = filteredJournals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revistas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie as revistas científicas integradas à biblioteca.</p>
        </div>
        <Link href="/adm/journals/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Revista
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pelo título ou link..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium min-w-[240px]">Revista</th>
                <th className="px-6 py-4 font-medium">Edições</th>
                <th className="px-6 py-4 font-medium">Criado em</th>
                <th className="px-6 py-4 font-medium text-right w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Carregando revistas...
                  </td>
                </tr>
              ) : paginatedJournals.map((journal) => (
                <tr key={journal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Book className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="max-w-[160px] md:max-w-xs lg:max-w-sm">
                        <div className="font-medium text-gray-900 dark:text-white truncate" title={journal.title}>{journal.title}</div>
                        <div className="text-xs text-gray-500 truncate" title={journal.link}>{journal.link || "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400">
                      {journal._count.issues} {journal._count.issues === 1 ? 'edição' : 'edições'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(journal.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {journal.link && (
                        <a 
                          href={journal.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors" 
                          title="Acessar Online"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Link href={`/adm/posts/new?importType=journal&importId=${journal.id}`}>
                        <button className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="Criar Postagem">
                          <Plus className="h-4 w-4" />
                        </button>
                      </Link>
                      <Link href={`/adm/journals/${journal.id}`}>
                        <button className="p-2 text-gray-400 hover:text-brand-500 transition-colors" title="Editar">
                          <Edit className="h-4 w-4" />
                        </button>
                      </Link>
                      <button onClick={() => setDeleteId(journal.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredJournals.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhuma revista encontrada.
            </div>
          )}
        </div>

        {!loading && filteredJournals.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredJournals.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Revista"
        description="Esta ação removerá permanentemente esta revista e todas as suas edições e artigos associados."
        loading={isDeleting}
      />
    </div>
  );
}
