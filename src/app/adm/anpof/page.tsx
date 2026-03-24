"use client";

import React, { useState, useEffect } from "react";
import { Search, Trash2, Loader2, Globe, Calendar, Type, Eye, Link as LinkIcon, CheckCircle2, Circle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { getAnpofEvents, deleteAnpofEvent, toggleAnpofEventUsed } from "@/actions/anpof";
import DeleteModal from "@/components/admin/content/DeleteModal";
import Pagination from "@/components/ui/pagination/Pagination";
import { Modal } from "@/components/ui/modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AnpofPage() {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewEvent, setViewEvent] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const data = await getAnpofEvents(projectId);
    setEvents(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteAnpofEvent(deleteId);
    await fetchEvents();
    setIsDeleting(false);
    setDeleteId(null);
  }

  async function handleToggleUsed(id: string, currentStatus: boolean) {
    setTogglingId(id);
    const result = await toggleAnpofEventUsed(id, !currentStatus);
    if (result.success) {
      setEvents((prev: any[]) => prev.map(e => e.id === id ? { ...e, isUsed: !currentStatus } : e));
    }
    setTogglingId(null);
  }

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.url.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedEvents = filteredEvents.slice(
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="h-6 w-6 text-brand-500" />
            Eventos - Anpof
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Conteúdo capturado automaticamente para futura publicação.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pelo título ou URL..."
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
                <th className="px-6 py-4 font-medium min-w-[300px]">Título / URL</th>
                <th className="px-6 py-4 font-medium w-40 text-center">Status</th>
                <th className="px-6 py-4 font-medium w-40">Data do Evento</th>
                <th className="px-6 py-4 font-medium text-right w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Carregando eventos...
                  </td>
                </tr>
              ) : paginatedEvents.map((event) => (
                <tr key={event.id} className={`transition-colors ${event.isUsed ? 'bg-gray-50/50 dark:bg-gray-800/20 opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`font-bold text-gray-900 dark:text-white line-clamp-1 ${event.isUsed ? 'line-through decoration-gray-400' : ''}`}>{event.title}</span>
                      <a 
                        href={event.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-brand-500 hover:underline flex items-center gap-1 opacity-70"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {event.url}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleUsed(event.id, event.isUsed)}
                      disabled={togglingId === event.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
                        ${event.isUsed 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-brand-50 hover:text-brand-600'}`}
                    >
                      {togglingId === event.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : event.isUsed ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                      {event.isUsed ? 'Publicado' : 'Pendente'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                       <Calendar className="h-3.5 w-3.5 opacity-40" />
                       <span className="text-xs font-medium">{event.eventDate || "—"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => setViewEvent(event)}
                        className="p-2 text-gray-400 hover:text-brand-500 transition-all hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg"
                        title="Ver Conteúdo"
                       >
                         <Eye className="h-4 w-4" />
                       </button>
                       <button 
                        onClick={() => setDeleteId(event.id)} 
                        className="p-2 text-gray-400 hover:text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" 
                        title="Excluir"
                       >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredEvents.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhum evento capturado.
            </div>
          )}
        </div>

        {!loading && filteredEvents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredEvents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Registro"
        description="Esta ação removerá permanentemente o conteúdo capturado. Esta ação não pode ser desfeita."
        loading={isDeleting}
      />

      {/* Ver Conteúdo Modal */}
      <Modal isOpen={!!viewEvent} onClose={() => setViewEvent(null)} className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white dark:bg-gray-900 p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center z-10 shadow-sm">
            <div>
                <h3 className="font-bold text-xl">{viewEvent?.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{viewEvent?.url}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant={viewEvent?.isUsed ? "outline" : "primary"} 
                    onClick={() => {
                        handleToggleUsed(viewEvent.id, viewEvent.isUsed);
                        const newStatus = !viewEvent.isUsed;
                        setViewEvent((prev: any) => ({ ...prev, isUsed: newStatus }));
                    }}
                    className="flex items-center gap-2"
                >
                    {viewEvent?.isUsed ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {viewEvent?.isUsed ? "Marcar como Pendente" : "Marcar como Publicado"}
                </Button>
                <Button variant="outline" onClick={() => setViewEvent(null)}>Fechar</Button>
            </div>
        </div>
        <div className="p-8 prose dark:prose-invert max-w-none prose-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {viewEvent?.content || ""}
            </ReactMarkdown>
        </div>
      </Modal>
    </div>
  );
}
