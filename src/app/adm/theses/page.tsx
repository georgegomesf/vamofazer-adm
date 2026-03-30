"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Edit, Trash2, Loader2, ExternalLink, User, School } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { getTheses, deleteThesis } from "@/actions/library";
import DeleteModal from "@/components/admin/content/DeleteModal";
import Pagination from "@/components/ui/pagination/Pagination";
import { useSession } from "next-auth/react";

export default function ThesesPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const projectRole = (session?.user as any)?.projectRole;
  const isAdmin = userRole === "ADMIN" || projectRole === "admin";

  const [search, setSearch] = useState("");
  const [theses, setTheses] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTheses();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, currentPage]);

  async function fetchTheses() {
    setLoading(true);
    try {
      const { theses: data, total } = await getTheses({ 
        page: currentPage, 
        pageSize: itemsPerPage, 
        search 
      });
      setTheses(data);
      setTotalItems(total);
    } catch (error) {
      console.error("Error fetching theses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteThesis(deleteId);
    await fetchTheses();
    setIsDeleting(false);
    setDeleteId(null);
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teses e Dissertações</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie as teses e dissertações da biblioteca.</p>
        </div>
        {/* Placeholder for manual creation if needed later */}
        {/* {isAdmin && (
          <Link href="/adm/theses/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nova Tese
            </Button>
          </Link>
        )} */}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pelo título, autor, universidade ou programa..."
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
                <th className="px-6 py-4 font-medium min-w-[240px]">Título</th>
                <th className="px-6 py-4 font-medium">Autor / Orientador</th>
                <th className="px-6 py-4 font-medium">IES / Programa</th>
                <th className="px-6 py-4 font-medium">Grau</th>
                <th className="px-6 py-4 font-medium text-right w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Carregando teses...
                  </td>
                </tr>
              ) : (
                theses.map((thesis: any) => (
                  <tr key={thesis.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="max-w-[160px] md:max-w-xs lg:max-w-sm">
                          <div className="font-medium text-gray-900 dark:text-white truncate" title={thesis.title}>{thesis.title}</div>
                          <div className="text-[10px] text-gray-500 truncate" title={thesis.id}>{thesis.year || "Ano não informado"} • {thesis.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col max-w-[150px]">
                        <div className="flex items-center gap-1 text-gray-900 dark:text-gray-300 font-medium">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate text-xs" title={thesis.authors}>{thesis.authors || "-"}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate ml-4" title={thesis.advisor}>
                           Or: {thesis.advisor || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col max-w-[180px]">
                        <div className="flex items-center gap-1 text-gray-900 dark:text-gray-300 font-medium">
                           <School className="h-3 w-3 shrink-0" />
                           <span className="text-xs truncate" title={thesis.university}>
                            {thesis.universityInitials || thesis.university}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 truncate" title={thesis.program}>
                          {thesis.program}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      <div className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 inline-block font-bold">
                        {thesis.degree}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {thesis.url && (
                          <a 
                            href={thesis.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors" 
                            title="Acessar Online"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link href={`/adm/posts/new?importType=thesis&importId=${thesis.id}`}>
                          <button className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="Criar Postagem">
                            <Plus className="h-4 w-4" />
                          </button>
                        </Link>
                        {isAdmin && (
                          <button onClick={() => setDeleteId(thesis.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && theses.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhuma tese ou dissertação encontrada.
            </div>
          )}
        </div>

        {!loading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Item"
        description="Esta ação removerá permanentemente este item da biblioteca."
        loading={isDeleting}
      />
    </div>
  );
}
