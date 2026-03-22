"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Tag as TagIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { createTag, updateTag } from "@/actions/tags";

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tag?: any;
}

export default function TagModal({ isOpen, onClose, onSuccess, tag }: TagModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
  });

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

  useEffect(() => {
    if (tag) {
      setFormData({
        title: tag.title || "",
        slug: tag.slug || "",
      });
    } else {
      setFormData({
        title: "",
        slug: "",
      });
    }
  }, [tag, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "title" && !tag) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (tag) {
        result = await updateTag(tag.id, formData);
      } else {
        result = await createTag(projectId, formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert("Erro ao salvar etiqueta: " + result.error);
      }
    } catch (error) {
      console.error("Error saving tag:", error);
      alert("Erro inesperado ao salvar etiqueta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-brand-500" />
          {tag ? "Editar Etiqueta" : "Nova Etiqueta"}
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
            placeholder="Ex: Platão"
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
            placeholder="platao"
            required
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
            {tag ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
