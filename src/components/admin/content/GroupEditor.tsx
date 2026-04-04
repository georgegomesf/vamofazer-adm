"use client";

import { useState, useEffect } from "react";
import { getGroupById, updateGroup } from "@/actions/groups";
import { uploadImage } from "@/actions/upload";
import { Save, Loader2, ChevronLeft, ImageIcon, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Link from "next/link";

export default function GroupEditorClient({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxSpots: "",
    allowWaitlist: false,
    isVisible: true,
    enrollmentStart: "",
    enrollmentEnd: "",
    logoUrl: "",
    backgroundUrl: "",
  });

  useEffect(() => {
    getGroupById(id).then(g => {
      if (g) {
        setGroup(g);
        setFormData({
          name: g.name || "",
          description: g.description || "",
          maxSpots: g.maxSpots ? String(g.maxSpots) : "",
          allowWaitlist: g.allowWaitlist || false,
          isVisible: g.isVisible !== false,
          enrollmentStart: g.enrollmentStart ? new Date(g.enrollmentStart).toISOString().slice(0, 16) : "",
          enrollmentEnd: g.enrollmentEnd ? new Date(g.enrollmentEnd).toISOString().slice(0, 16) : "",
          logoUrl: g.logoUrl || "",
          backgroundUrl: g.backgroundUrl || "",
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "backgroundUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await uploadImage(form);
      setFormData(prev => ({ ...prev, [field]: result.url }));
    } catch {
      alert("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGroup(id, {
        ...formData,
        maxSpots: formData.maxSpots ? parseInt(formData.maxSpots) : null,
        enrollmentStart: formData.enrollmentStart ? new Date(formData.enrollmentStart) : null,
        enrollmentEnd: formData.enrollmentEnd ? new Date(formData.enrollmentEnd) : null,
        updatedAt: new Date(),
      });
      router.push("/adm/groups");
    } catch {
      alert("Erro ao salvar grupo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!group) return <p className="text-center text-gray-500 py-20">Grupo não encontrado.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações do Grupo</h1>
            <p className="text-gray-500 text-sm">{group.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/adm/groups/${id}/manage`}>
            <Button variant="outline" className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" /> Participantes
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || isUploading} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-5">Informações Gerais</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Grupo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vagas (max)</label>
                  <input
                    type="number"
                    value={formData.maxSpots}
                    onChange={e => setFormData(p => ({ ...p, maxSpots: e.target.value }))}
                    placeholder="Ilimitado"
                    min={0}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col justify-center mt-5 gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowWaitlist}
                      onChange={e => setFormData(p => ({ ...p, allowWaitlist: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Lista de Espera</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={e => setFormData(p => ({ ...p, isVisible: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Visível</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Início das Inscrições</label>
                  <input
                    type="datetime-local"
                    value={formData.enrollmentStart}
                    onChange={e => setFormData(p => ({ ...p, enrollmentStart: e.target.value }))}
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fim das Inscrições</label>
                  <input
                    type="datetime-local"
                    value={formData.enrollmentEnd}
                    onChange={e => setFormData(p => ({ ...p, enrollmentEnd: e.target.value }))}
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Images */}
        <div className="space-y-6">
          {/* Logo */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Logo</h3>
            <div className="aspect-square relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
              ) : formData.logoUrl ? (
                <div className="group relative w-full h-full">
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                  <button type="button" onClick={() => setFormData(p => ({ ...p, logoUrl: "" }))}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer text-center p-4 w-full h-full flex flex-col items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <span className="text-xs text-gray-400">Upload Logo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, "logoUrl")} />
                </label>
              )}
            </div>
          </section>
          {/* Background */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Imagem de Fundo</h3>
            <div className="aspect-video relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
              ) : formData.backgroundUrl ? (
                <div className="group relative w-full h-full">
                  <img src={formData.backgroundUrl} alt="Background" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData(p => ({ ...p, backgroundUrl: "" }))}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer text-center p-4 w-full h-full flex flex-col items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <span className="text-xs text-gray-400">Upload Capa</span>
                  <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, "backgroundUrl")} />
                </label>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
