"use client";

import { useState, useEffect } from "react";
import { useProject } from "@/context/ProjectContext";
import { getGroups, deleteGroup, createGroup } from "@/actions/groups";
import { useSession } from "next-auth/react";
import { Plus, Search, Users, Settings, Trash2, Loader2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Link from "next/link";

export default function GroupsPage() {
  const { data: session } = useSession();
  const { projectId } = useProject();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });

  const fetchGroups = async () => {
    if (!projectId) return;
    setLoading(true);
    const data = await getGroups(projectId);
    setGroups(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [projectId]);

  const handleCreate = async () => {
    if (!projectId || !newGroup.name.trim()) return;
    setCreating(true);
    try {
      await createGroup(projectId, newGroup, session?.user?.id);
      setShowCreateModal(false);
      setNewGroup({ name: "", description: "" });
      await fetchGroups();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o grupo "${name}"? Esta ação é irreversível.`)) return;
    await deleteGroup(id);
    await fetchGroups();
  };

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grupos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie os grupos e seus membros.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo Grupo
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar grupos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
        />
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-20 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {search ? "Nenhum grupo encontrado." : "Nenhum grupo cadastrado ainda."}
          </p>
          {!search && (
            <button onClick={() => setShowCreateModal(true)} className="mt-4 text-brand-500 text-sm font-semibold hover:underline">
              Criar primeiro grupo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(group => (
            <div key={group.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-all">
              {/* Cover */}
              <div className="h-28 bg-gradient-to-br from-brand-500/20 to-brand-600/10 relative overflow-hidden">
                {group.backgroundUrl ? (
                  <img src={group.backgroundUrl} alt={group.name} className="w-full h-full object-cover" />
                ) : group.logoUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img src={group.logoUrl} alt={group.name} className="h-16 w-16 object-contain" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-brand-500/40" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{group.name}</h3>
                    {group.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{group.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 mb-4">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {group._count?.GroupMembership ?? 0}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/adm/groups/${group.id}/manage`} className="flex-1">
                    <Button variant="primary" className="w-full h-9 text-xs flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Participantes
                    </Button>
                  </Link>
                  <Link href={`/adm/groups/${group.id}`}>
                    <Button variant="outline" className="h-9 px-3">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className={`h-9 px-3 ${group.ActionGroup?.length > 0 ? 'text-gray-300 cursor-not-allowed border-gray-100' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/30'}`}
                    onClick={() => {
                        if (group.ActionGroup?.length > 0) {
                            alert("Este grupo está vinculado a uma Ação e não pode ser excluído. Desvincule-o primeiro nas configurações da Ação.");
                            return;
                        }
                        handleDelete(group.id, group.name);
                    }}
                    title={group.ActionGroup?.length > 0 ? "Grupo vinculado a uma Ação" : "Excluir Grupo"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Novo Grupo</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Grupo *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Turma 2024"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <textarea
                  value={newGroup.description}
                  onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descreva o grupo..."
                  rows={3}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating || !newGroup.name.trim()} className="flex-1">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Grupo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
