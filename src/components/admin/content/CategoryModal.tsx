"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Layout, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { createCategory, updateCategory } from "@/actions/categories";
import { uploadImage, deleteImage } from "@/actions/upload";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any; // If provided, it's edit mode
}

export default function CategoryModal({ isOpen, onClose, onSuccess, category }: CategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    imageUrl: "",
  });

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  useEffect(() => {
    if (category) {
      setFormData({
        title: category.title || "",
        slug: category.slug || "",
        description: category.description || "",
        imageUrl: category.imageUrl || "",
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        description: "",
        imageUrl: "",
      });
    }
  }, [category, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug from title if it's new
    if (name === "title" && !category) {
      const generatedSlug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      setFormData(prev => ({ ...prev, [name]: value, slug: generatedSlug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      if (formData.imageUrl && formData.imageUrl.includes("blob.vercel-storage.com")) {
        await deleteImage(formData.imageUrl);
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const blob = await uploadImage(formDataUpload);
      setFormData(prev => ({ ...prev, imageUrl: blob.url }));
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Falha no upload da imagem.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (category) {
        result = await updateCategory(category.id, formData);
      } else {
        result = await createCategory(projectId, formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert("Erro ao salvar categoria: " + result.error);
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Erro inesperado ao salvar categoria.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Layout className="h-5 w-5 text-brand-500" />
          {category ? "Editar Categoria" : "Nova Categoria"}
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
            placeholder="Ex: Filosofia Antiga"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="filosofia-antiga"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
            placeholder="Breve descrição da categoria..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Imagem da Categoria
          </label>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="block text-xs font-semibold text-brand-500 hover:text-brand-600 cursor-pointer">
                Fazer Upload
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                placeholder="Ou URL da imagem..."
              />
            </div>
          </div>
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
            {category ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
