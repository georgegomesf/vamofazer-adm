"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  UserPlus,
  Loader2,
  Check,
  X,
  User as UserIcon,
  Shield,
  Mail,
  Lock
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";

interface ProjectUser {
  id: string;
  name: string | null;
  email: string;
  projectRole: string;
  userRole: string;
}

const roleOptions = [
  { value: "admin", label: "Admin", color: "primary" as const },
  { value: "editor", label: "Editor", color: "warning" as const },
  { value: "member", label: "Membro", color: "success" as const },
  { value: "visitor", label: "Visitante", color: "info" as const },
  { value: "blocked", label: "Bloqueado", color: "error" as const },
];

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProjectUser | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "visitor"
  });

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;

  useEffect(() => {
    fetchUsers();
  }, [projectId]);

  async function fetchUsers() {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${authServiceUrl}/api/projects/${projectId}/users`);
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ type: "error", text: "Erro ao carregar usuários." });
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (user: ProjectUser | null = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name || "",
        email: user.email,
        password: "",
        role: user.projectRole || "visitor"
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "visitor"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({ name: "", email: "", password: "", role: "visitor" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setSubmitting(true);
    setMessage(null);

    try {
      if (selectedUser) {
        // Update user
        await axios.patch(`${authServiceUrl}/api/projects/${projectId}/users/${selectedUser.id}`, {
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
          role: formData.role
        });
        setMessage({ type: "success", text: "Usuário atualizado com sucesso!" });
      } else {
        // Create user
        await axios.post(`${authServiceUrl}/api/projects/${projectId}/users`, {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        setMessage({ type: "success", text: "Usuário criado com sucesso!" });
      }
      fetchUsers();
      handleCloseModal();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error saving user:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Erro ao salvar usuário."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !projectId) return;
    setSubmitting(true);
    try {
      await axios.delete(`${authServiceUrl}/api/projects/${projectId}/users/${selectedUser.id}`);
      setMessage({ type: "success", text: "Vínculo removido com sucesso!" });
      fetchUsers();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage({ type: "error", text: "Erro ao remover vínculo." });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const option = roleOptions.find(o => o.value === role.toLowerCase()) || roleOptions[2];
    return (
      <Badge color={option.color} variant="light">
        {option.label}
      </Badge>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie quem tem acesso ao painel administrativo do projeto.</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === "success"
            ? "bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
            : "bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
          }`}>
          {message.type === "success" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableRow>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfil</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell className="px-6 py-12 text-center text-gray-500 dark:text-gray-400" colSpan={3}>
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name || "Sem nome"}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {getRoleBadge(user.projectRole)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={user.email === session?.user?.email}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-lg">
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedUser ? "Editar Usuário" : "Novo Usuário"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedUser ? "Atualize as informações do usuário." : "Preencha os dados para criar e vincular um novo usuário."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Nome Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="Ex: João Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4" /> E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Lock className="h-4 w-4" /> {selectedUser ? "Nova Senha (opcional)" : "Senha"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder={selectedUser ? "Deixe em branco para não alterar" : "Mínimo 6 caracteres"}
                required={!selectedUser}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Perfil (Role)
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {selectedUser ? "Salvar Alterações" : "Criar Usuário"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-md">
        <div className="p-6 md:p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500 mb-4">
            <Trash2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remover Vínculo?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Você tem certeza que deseja remover o vínculo de <strong>{selectedUser?.name || selectedUser?.email}</strong> com este projeto? O usuário perderá acesso a este painel.
          </p>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteUser}
              className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Remoção
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
