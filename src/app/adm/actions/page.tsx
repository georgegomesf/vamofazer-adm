"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Calendar, Edit, Trash2, Loader2, Clock, CheckCircle2, ListTodo } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { getActions, deleteAction } from "@/actions/actions";
import DeleteModal from "@/components/admin/content/DeleteModal";
import Pagination from "@/components/ui/pagination/Pagination";
import { useProject } from "@/context/ProjectContext";

export default function ActionsPage() {
  const [search, setSearch] = useState("");
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { projectId } = useProject();

  useEffect(() => {
    fetchActions();
  }, [projectId]);

  async function fetchActions() {
    if (!projectId) return;
    setLoading(true);
    const data = await getActions(projectId);
    setActions(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteAction(deleteId);
    await fetchActions();
    setIsDeleting(false);
    setDeleteId(null);
  }

  const filteredActions = actions.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedActions = filteredActions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'Evento':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'Prazo':
        return <Clock className="h-5 w-5 text-red-500" />;
      case 'Atividade':
        return <ListTodo className="h-5 w-5 text-emerald-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ações</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie eventos, prazos e atividades vinculadas às suas postagens.</p>
        </div>
        <Link href="/adm/actions/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Ação
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pelo título ou tipo..."
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
                <th className="px-6 py-4 font-medium min-w-[240px]">Ação</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Data/Hora</th>
                <th className="px-6 py-4 font-medium text-center">Vínculos</th>
                <th className="px-6 py-4 font-medium text-right w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Carregando ações...
                  </td>
                </tr>
              ) : paginatedActions.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        {action.imageUrl ? (
                          <img src={action.imageUrl} className="h-full w-full object-cover" />
                        ) : (
                          getActionIcon(action.type)
                        )}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white max-w-[160px] md:max-w-xs lg:max-w-sm truncate" title={action.title}>
                        {action.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${action.type === 'Evento' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300' : 
                        action.type === 'Prazo' ? 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300' : 
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
                      {action.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    <div className="flex flex-col text-xs">
                      {action.startDate && (
                        <span className="flex items-center gap-1">
                          <span className="font-semibold uppercase text-[10px] text-gray-400 w-8">De:</span>
                          {new Date(action.startDate).toLocaleString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      )}
                      {action.endDate && (
                        <span className="flex items-center gap-1 mt-0.5">
                          <span className="font-semibold uppercase text-[10px] text-gray-400 w-8">Até:</span>
                          {new Date(action.endDate).toLocaleString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      )}
                      {!action.startDate && !action.endDate && <span className="text-gray-400 italic">Sem data</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap text-center">
                    <span className="font-medium text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{action._count?.posts || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/adm/actions/${action.id}`}>
                        <button className="p-2 text-gray-400 hover:text-brand-500 transition-colors" title="Editar">
                          <Edit className="h-4 w-4" />
                        </button>
                      </Link>
                      <button onClick={() => setDeleteId(action.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredActions.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhuma ação encontrada.
            </div>
          )}
        </div>

        {!loading && filteredActions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredActions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Ação"
        description="Esta ação removerá permanentemente esta ação do seu projeto. Postagens vinculadas deixarão de exibir estas informações."
        loading={isDeleting}
      />
    </div>
  );
}
