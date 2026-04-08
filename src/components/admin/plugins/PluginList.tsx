"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  X, 
  ImageIcon, 
  Check, 
  XCircle,
  Puzzle
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import { 
  getPlugins, 
  createPlugin, 
  updatePlugin, 
  deletePlugin 
} from "@/actions/plugins";
import { uploadImage } from "@/actions/upload";
import DeleteModal from "@/components/admin/content/DeleteModal";
import Pagination from "@/components/ui/pagination/Pagination";
import { 
  getPluginTypeInfo, 
  getPluginCategoryInfo, 
  getAllPluginTypes, 
  getAllPluginCategories 
} from "@/lib/plugin-utils";
import { PluginType, PluginCategory } from "@prisma/client";

export default function PluginList() {
  const [search, setSearch] = useState("");
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Delete modal states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "STANDARD" as PluginType,
    category: "ACTIVITY" as PluginCategory,
    imageUrl: "",
    available: true,
  });

  useEffect(() => {
    fetchPlugins();
  }, []);

  async function fetchPlugins() {
    setLoading(true);
    const data = await getPlugins();
    setPlugins(data);
    setLoading(false);
  }

  const handleOpenModal = (plugin?: any) => {
    if (plugin) {
      setEditingPlugin(plugin);
      setFormData({
        name: plugin.name,
        description: plugin.description || "",
        type: plugin.type,
        category: plugin.category,
        imageUrl: plugin.imageUrl || "",
        available: plugin.available,
      });
    } else {
      setEditingPlugin(null);
      setFormData({
        name: "",
        description: "",
        type: "STANDARD",
        category: "ACTIVITY",
        imageUrl: "",
        available: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsSaving(true);
    try {
      if (editingPlugin) {
        await updatePlugin(editingPlugin.id, formData);
      } else {
        await createPlugin(formData);
      }
      await fetchPlugins();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving plugin:", error);
      alert("Erro ao salvar plugin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deletePlugin(deleteId);
      await fetchPlugins();
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting plugin:", error);
      alert("Erro ao excluir plugin.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const result = await uploadImage(uploadFormData);
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredPlugins = plugins.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedPlugins = filteredPlugins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plugins</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie os plugins disponíveis para as ações do sistema.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo Plugin
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pelo nome..."
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
                <th className="px-6 py-4 font-medium min-w-[240px]">Plugin</th>
                <th className="px-6 py-4 font-medium text-center">Tipo</th>
                <th className="px-6 py-4 font-medium text-center">Categoria</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Carregando plugins...
                  </td>
                </tr>
              ) : paginatedPlugins.map((plugin) => {
                const typeInfo = getPluginTypeInfo(plugin.type);
                const catInfo = getPluginCategoryInfo(plugin.category);
                
                return (
                  <tr key={plugin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                          {plugin.imageUrl ? (
                            <img src={plugin.imageUrl} className="h-full w-full object-cover" />
                          ) : (
                            <Puzzle className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white uppercase italic tracking-tight">
                            {plugin.name}
                          </div>
                          {plugin.description && (
                            <div className="text-[10px] text-gray-400 font-medium line-clamp-1">
                              {plugin.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${catInfo.color}`}>
                        {catInfo.icon} {catInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {plugin.available ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                          <Check size={12} /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                          <XCircle size={12} /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(plugin)} 
                          className="p-2 text-gray-400 hover:text-brand-500 transition-colors" 
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(plugin.id)} 
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors" 
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filteredPlugins.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-3">
              <Puzzle className="h-12 w-12 text-gray-200" />
              <p>Nenhum plugin encontrado.</p>
            </div>
          )}
        </div>

        {!loading && filteredPlugins.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPlugins.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Plugin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-xl font-bold dark:text-white uppercase italic tracking-tight">
                {editingPlugin ? "Editar Plugin" : "Novo Plugin"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Nome do Plugin</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                  placeholder="Nome do plugin..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white min-h-[100px]"
                  placeholder="Descreva o que este plugin faz..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PluginType }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white appearance-none"
                  >
                    {getAllPluginTypes().map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as PluginCategory }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all dark:bg-gray-800/50 dark:border-gray-700 dark:text-white appearance-none"
                  >
                    {getAllPluginCategories().map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Imagem do Plugin</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-500">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                      ) : formData.imageUrl ? (
                        <img src={formData.imageUrl} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    {formData.imageUrl && !isUploading && (
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-brand-500/20 active:scale-95">
                      <ImageIcon size={14} /> Selecionar Imagem
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Recomendado: 512x512px (PNG ou JPG)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                      className="peer h-6 w-11 appearance-none rounded-full bg-gray-200 transition-all checked:bg-green-500 dark:bg-gray-700"
                    />
                    <div className="absolute left-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Plugin Disponível no Sistema
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm"
                >
                  Cancelar
                </button>
                <Button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-8 flex items-center gap-2"
                >
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                  ) : (
                    "Salvar Plugin"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Plugin"
        description="Esta ação removerá permanentemente o plugin do sistema. Esta operação não pode ser desfeita."
        loading={isDeleting}
      />
    </div>
  );
}
