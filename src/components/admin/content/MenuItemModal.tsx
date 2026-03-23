"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Menu as MenuIcon, Link as LinkIcon, Layers, FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { createMenuItem, updateMenuItem } from "@/actions/menu";
import { getCategories } from "@/actions/categories";
import { getPosts } from "@/actions/posts";

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: any;
  parentId?: string | null;
}

export default function MenuItemModal({ isOpen, onClose, onSuccess, item, parentId }: MenuItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    order: 0,
    type: "item",
    categoryId: null as string | null,
    postId: null as string | null,
    linkType: "url" as "url" | "category" | "post" | "section",
  });

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      const linkType = item.type === "section" ? "section" : item.categoryId ? "category" : item.postId ? "post" : "url";
      setFormData({
        title: item.title || "",
        url: item.url || "",
        order: item.order || 0,
        type: item.type || "item",
        categoryId: item.categoryId || null,
        postId: item.postId || null,
        linkType,
      });
    } else {
      setFormData({
        title: "",
        url: "",
        order: 0,
        type: parentId ? "subitem" : "item",
        categoryId: null,
        postId: null,
        linkType: "url",
      });
    }
  }, [item, parentId, isOpen]);

  async function fetchData() {
    const [cats, pts] = await Promise.all([
      getCategories(projectId),
      getPosts(projectId)
    ]);
    setCategories(cats);
    setPosts(pts);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "order" ? parseInt(value) : value 
    }));
  };

  const handleLinkTypeChange = (type: "url" | "category" | "post" | "section") => {
    setFormData(prev => ({
      ...prev,
      linkType: type,
      url: type === "url" ? prev.url : "",
      categoryId: type === "category" ? prev.categoryId : null,
      postId: type === "post" ? prev.postId : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = {
      title: formData.title,
      url: formData.linkType === "url" ? formData.url : null,
      order: formData.order,
      type: formData.linkType === "section" ? "section" : formData.type,
      parentId: parentId || null,
      categoryId: formData.linkType === "category" ? formData.categoryId : null,
      postId: formData.linkType === "post" ? formData.postId : null,
    };

    try {
      let result;
      if (item) {
        result = await updateMenuItem(item.id, submissionData);
      } else {
        result = await createMenuItem(projectId, submissionData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert("Erro ao salvar item: " + result.error);
      }
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert("Erro inesperado ao salvar item de menu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MenuIcon className="h-5 w-5 text-brand-500" />
          {item ? "Editar Item de Menu" : "Novo Item de Menu"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Ex: Blog"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Link</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "url", label: "URL", icon: LinkIcon },
              { id: "category", label: "Categoria", icon: Layers },
              { id: "post", label: "Postagem", icon: FileText },
              { id: "section", label: "Seção", icon: MenuIcon },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleLinkTypeChange(type.id as any)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border gap-1 transition-all ${
                  formData.linkType === type.id
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-gray-200 hover:border-gray-300 text-gray-500 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <type.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {formData.linkType === "url" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL / Link Externo</label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="https://..."
            />
          </div>
        )}

        {formData.linkType === "category" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vincular Categoria</label>
            <select
              name="categoryId"
              value={formData.categoryId || ""}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.title}</option>
              ))}
            </select>
          </div>
        )}

        {formData.linkType === "post" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vincular Postagem</label>
            <select
              name="postId"
              value={formData.postId || ""}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Selecione uma postagem...</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>{post.title}</option>
              ))}
            </select>
          </div>
        )}

        {formData.linkType === "section" && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-500 italic">
            Este item funcionará apenas como um agrupador (Pai) no menu, sem link próprio.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordem</label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
            {item ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
