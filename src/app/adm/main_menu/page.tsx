"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Menu as MenuIcon, GripVertical, Link as LinkIcon, Edit, Trash2, Layers, Loader2, FileText } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { getMenuItems, deleteMenuItem } from "@/actions/menu";
import MenuItemModal from "@/components/admin/content/MenuItemModal";
import DeleteModal from "@/components/admin/content/DeleteModal";
import Pagination from "@/components/ui/pagination/Pagination";

export default function MainMenuPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const data = await getMenuItems(projectId);
    setItems(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteMenuItem(deleteId);
    await fetchItems();
    setIsDeleting(false);
    setDeleteId(null);
  }

  function handleAdd(pId: string | null = null) {
    setSelectedItem(null);
    setParentId(pId);
    setIsModalOpen(true);
  }

  function handleEdit(item: any) {
    setSelectedItem(item);
    setParentId(item.parentId);
    setIsModalOpen(true);
  }

  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedItems = filteredItems.slice(
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Principal</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie a estrutura de navegação principal do seu site.</p>
        </div>
        <Button onClick={() => handleAdd()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo Item de Menu
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar itens..."
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
                <th className="w-12 px-6 py-4"></th>
                <th className="px-6 py-4 font-medium min-w-[200px]">Título do Item</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Destino</th>
                <th className="px-6 py-4 font-medium text-right w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Carregando menus...
                  </td>
                </tr>
              ) : paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.type === "subitem" && (
                        <div className="w-4 h-px bg-gray-300 dark:bg-gray-700 ml-2" />
                      )}
                      <div className={`flex items-center gap-2 max-w-[180px] md:max-w-xs ${item.type === 'subitem' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
                        {item.type === "item" ? <MenuIcon className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <Layers className="h-3 w-3 text-gray-300 flex-shrink-0" />}
                        <span className="truncate" title={item.title}>{item.title}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm">
                      {item.type === 'item' ? 'Menu Principal' : 'Subitem'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm max-w-[200px] md:max-w-[300px]">
                      <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      {item.url ? (
                        <span className="truncate" title={item.url}>{item.url}</span>
                      ) : item.category ? (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 truncate" title={`Categoria: ${item.category.title}`}>
                          <Layers className="h-3 w-3 flex-shrink-0" /> {item.category.title}
                        </span>
                      ) : item.post ? (
                        <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 truncate" title={`Postagem: ${item.post.title}`}>
                          <FileText className="h-3 w-3 flex-shrink-0" /> {item.post.title}
                        </span>
                      ) : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {item.type === 'item' && (
                        <button onClick={() => handleAdd(item.id)} className="p-2 text-gray-400 hover:text-brand-500 transition-colors" title="Adicionar Subitem">
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-brand-500 transition-colors" title="Editar">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteId(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredItems.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhum item de menu configurado.
            </div>
          )}
        </div>

        {!loading && filteredItems.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredItems.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <MenuItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchItems}
        item={selectedItem}
        parentId={parentId}
      />

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Item de Menu"
        description="Esta ação removerá permanentemente este item da navegação. Subitens vinculados também serão excluídos."
        loading={isDeleting}
      />
    </div>
  );
}
