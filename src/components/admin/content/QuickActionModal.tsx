"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Calendar, Clock, ListTodo, Type, Building2, Globe, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { createAction } from "@/actions/actions";

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (actionId: string, type: string) => void;
  allActions: any[];
  linkedActionIds: string[];
}

export default function QuickActionModal({ isOpen, onClose, onSuccess, allActions, linkedActionIds }: QuickActionModalProps) {
  const [activeTab, setActiveTab] = useState<"new" | "existing">("existing");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    type: "Atividade",
    description: "",
    organizer: "",
    url: "",
    startDate: "",
    endDate: "",
  });

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate + (formData.startDate.includes("Z") ? "" : "-03:00")).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate + (formData.endDate.includes("Z") ? "" : "-03:00")).toISOString() : null,
      };
      
      const result = await createAction(projectId, submissionData);

      if (result.success && result.action) {
        onSuccess(result.action.id, result.action.type);
        onClose();
        setFormData({ title: "", type: "Atividade", description: "", organizer: "", url: "", startDate: "", endDate: "" });
      } else {
        alert("Erro ao salvar ação: " + (result.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Error saving action:", error);
      alert("Erro inesperado ao salvar ação.");
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = allActions
    .filter(a => !linkedActionIds.includes(a.id))
    .filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const displayedActions = searchTerm ? filteredActions : filteredActions.slice(0, 5);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'Evento': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'Prazo': return <Clock className="h-4 w-4 text-red-500" />;
      default: return <ListTodo className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Type className="h-5 w-5 text-brand-500" />
          Gerenciar Ações
        </h2>
      </div>

      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("existing")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "existing" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
        >
          Vincular Existente
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("new")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "new" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500"}`}
        >
          Criar Nova
        </button>
      </div>

      {activeTab === "existing" ? (
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar ações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {displayedActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  onSuccess(action.id, action.type);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-brand-500 hover:bg-brand-50 dark:border-gray-800 dark:hover:bg-brand-500/10 transition-all flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-2">
                  {getActionIcon(action.type)}
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{action.title}</span>
                </div>
                <div className="flex items-center gap-2 ml-6 text-[10px] text-gray-500 uppercase tracking-tight">
                    <span>{action.type}</span>
                    {action.organizer && (
                        <>
                            <span>•</span>
                            <span>{action.organizer}</span>
                        </>
                    )}
                </div>
              </button>
            ))}
            {displayedActions.length === 0 && (
              <div className="py-8 text-center text-gray-500 italic text-sm">
                {searchTerm ? "Nenhuma ação encontrada para esta busca." : "Nenhuma ação disponível para vincular."}
              </div>
            )}
            {!searchTerm && filteredActions.length > 5 && (
              <p className="text-[10px] text-center text-gray-400 pt-2 uppercase tracking-widest font-bold opacity-60">
                Digite para buscar entre outras {filteredActions.length - 5} ações
              </p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="Atividade">Atividade</option>
                <option value="Evento">Evento</option>
                <option value="Prazo">Prazo</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organizador</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Link / URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Início</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Fim</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Criar e Vincular
            </Button>
          </div>
        </form>
      )}

      {activeTab === "existing" && (
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </Modal>
  );
}
